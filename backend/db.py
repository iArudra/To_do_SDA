import os
import pymysql
import pymysql.cursors
from werkzeug.security import generate_password_hash, check_password_hash
from crypto_utils import encrypt_text, decrypt_text


def get_db_connection():
    """Create and return a new MySQL connection using environment variables."""
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 3306)),
        db=os.getenv('DB_NAME', 'tododb'),
        user=os.getenv('DB_USER', 'admin'),
        password=os.getenv('DB_PASSWORD', ''),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=15,
        autocommit=False
    )


class Database:
    def __init__(self):
        self._init_dbs()

    def _init_dbs(self):
        """Initialize all tables if they don't exist."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        phone TEXT,
                        password TEXT,
                        mfa_secret TEXT,
                        mfa_enabled TINYINT(1) DEFAULT 0
                    ) CHARACTER SET utf8mb4
                ''')
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS purchases (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_email VARCHAR(255) NOT NULL,
                        item_id VARCHAR(255) NOT NULL,
                        amount INT,
                        razorpay_order_id VARCHAR(255),
                        razorpay_payment_id VARCHAR(255),
                        status VARCHAR(50) DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) CHARACTER SET utf8mb4
                ''')
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS tasks (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_email VARCHAR(255) NOT NULL,
                        text TEXT NOT NULL,
                        category VARCHAR(255),
                        notes TEXT,
                        due_date VARCHAR(50),
                        completed TINYINT(1) DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) CHARACTER SET utf8mb4
                ''')
            conn.commit()
        finally:
            conn.close()

    def create_user(self, name, email, phone, password):
        conn = get_db_connection()
        try:
            hashed_password = generate_password_hash(password)
            encrypted_name = encrypt_text(name)
            encrypted_phone = encrypt_text(phone or '')
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO users (name, email, phone, password) VALUES (%s, %s, %s, %s)',
                    (encrypted_name, email, encrypted_phone, hashed_password)
                )
            conn.commit()
            return True
        except pymysql.err.IntegrityError:
            return False  # Duplicate email
        finally:
            conn.close()

    def verify_user(self, email, password):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT name, email, phone, mfa_enabled, mfa_secret, password FROM users WHERE email = %s',
                    (email,)
                )
                user = cur.fetchone()
                if not user:
                    return None

                stored_password = user['password']
                is_valid = False

                if stored_password and stored_password.startswith(('pbkdf2:sha256:', 'scrypt:')):
                    is_valid = check_password_hash(stored_password, password)
                elif stored_password:
                    # Legacy plain text — verify and migrate
                    if stored_password == password:
                        is_valid = True
                        new_hash = generate_password_hash(password)
                        enc_name = encrypt_text(user['name'])
                        enc_phone = encrypt_text(user['phone'] or '')
                        cur.execute(
                            'UPDATE users SET password = %s, name = %s, phone = %s WHERE email = %s',
                            (new_hash, enc_name, enc_phone, email)
                        )
                        conn.commit()

                if is_valid:
                    return (
                        decrypt_text(user['name']),
                        user['email'],
                        decrypt_text(user['phone'] or ''),
                        bool(user['mfa_enabled']),
                        user['mfa_secret']
                    )
                return None
        finally:
            conn.close()

    def get_user_by_email(self, email):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT name, email, phone, mfa_enabled, mfa_secret FROM users WHERE email = %s',
                    (email,)
                )
                user = cur.fetchone()
                if user:
                    return (
                        decrypt_text(user['name']),
                        user['email'],
                        decrypt_text(user['phone'] or ''),
                        bool(user['mfa_enabled']),
                        user['mfa_secret']
                    )
                return None
        finally:
            conn.close()

    def create_oauth_user(self, name, email):
        conn = get_db_connection()
        try:
            encrypted_name = encrypt_text(name)
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO users (name, email) VALUES (%s, %s)',
                    (encrypted_name, email)
                )
            conn.commit()
            return True
        except pymysql.err.IntegrityError:
            return False
        finally:
            conn.close()

    def add_task(self, user_email, text, category, notes, due_date):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    '''INSERT INTO tasks (user_email, text, category, notes, due_date)
                       VALUES (%s, %s, %s, %s, %s)''',
                    (user_email, text, category, notes, due_date)
                )
                task_id = cur.lastrowid
            conn.commit()
            return task_id
        finally:
            conn.close()

    def get_tasks(self, user_email):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT * FROM tasks WHERE user_email = %s ORDER BY created_at DESC',
                    (user_email,)
                )
                rows = cur.fetchall()
            tasks = []
            for row in rows:
                tasks.append({
                    'id': row['id'],
                    'user_email': row['user_email'],
                    'text': row['text'],
                    'category': row['category'],
                    'notes': row['notes'],
                    'due_date': row['due_date'],
                    'completed': bool(row['completed']),
                    'created_at': str(row['created_at'])
                })
            return tasks
        finally:
            conn.close()

    def update_task_status(self, task_id, completed):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE tasks SET completed = %s WHERE id = %s',
                    (1 if completed else 0, task_id)
                )
            conn.commit()
        finally:
            conn.close()

    def enable_mfa(self, email, secret):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE users SET mfa_secret = %s, mfa_enabled = 1 WHERE email = %s',
                    (secret, email)
                )
            conn.commit()
        finally:
            conn.close()

    def delete_task(self, task_id):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
            conn.commit()
        finally:
            conn.close()

    def add_purchase(self, user_email, item_id, amount, order_id):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    '''INSERT INTO purchases (user_email, item_id, amount, razorpay_order_id, status)
                       VALUES (%s, %s, %s, %s, 'pending')''',
                    (user_email, item_id, amount, order_id)
                )
                purchase_id = cur.lastrowid
            conn.commit()
            return purchase_id
        finally:
            conn.close()

    def update_purchase_success(self, order_id, payment_id):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE purchases SET razorpay_payment_id = %s, status = "completed" WHERE razorpay_order_id = %s',
                    (payment_id, order_id)
                )
            conn.commit()
        finally:
            conn.close()

    def get_purchased_themes(self, user_email):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT item_id FROM purchases WHERE user_email = %s AND status = "completed"',
                    (user_email,)
                )
                return [row['item_id'] for row in cur.fetchall()]
        finally:
            conn.close()

    def get_task_owner(self, task_id):
        """Retrieve the email of the user who owns the given task ID."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT user_email FROM tasks WHERE id = %s', (task_id,))
                row = cur.fetchone()
                return row['user_email'] if row else None
        finally:
            conn.close()

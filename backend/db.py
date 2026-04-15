import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from crypto_utils import encrypt_text, decrypt_text

class Database:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # In K8s, we mount the volume at /app/data to avoid overwriting code in /app
        data_dir = os.path.join(base_dir, 'data')
        if not os.path.exists(data_dir):
            try:
                os.makedirs(data_dir, exist_ok=True)
            except Exception:
                # Fallback to base_dir if we can't create /app/data
                data_dir = base_dir
                
        self.users_db = os.path.join(data_dir, 'users.db')
        self.tasks_db = os.path.join(data_dir, 'tasks.db')
        self._init_dbs()

    def _get_connection(self, db_name):
        return sqlite3.connect(db_name)

    def _init_dbs(self):
        # Initialize Users DB
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    phone TEXT,
                    password TEXT,
                    mfa_secret TEXT,
                    mfa_enabled BOOLEAN DEFAULT 0
                )
            ''')
            
            # Simple migration for existing DB
            try:
                cursor.execute('ALTER TABLE users ADD COLUMN mfa_secret TEXT')
                cursor.execute('ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0')
            except sqlite3.OperationalError:
                pass # Columns already exist

            conn.commit()

        # Initialize Purchases DB (inside users_db for simplicity)
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS purchases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    amount INTEGER,
                    razorpay_order_id TEXT,
                    razorpay_payment_id TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()

        # Initialize Tasks DB
        with self._get_connection(self.tasks_db) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT NOT NULL,
                    text TEXT NOT NULL,
                    category TEXT,
                    notes TEXT,
                    due_date TEXT,
                    completed BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()

    def create_user(self, name, email, phone, password):
        try:
            hashed_password = generate_password_hash(password)
            encrypted_name = encrypt_text(name)
            encrypted_phone = encrypt_text(phone)
            
            with self._get_connection(self.users_db) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
                    (encrypted_name, email, encrypted_phone, hashed_password)
                )
                conn.commit()
                return True
        except sqlite3.IntegrityError:
            return False

    def verify_user(self, email, password):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'SELECT name, email, phone, mfa_enabled, mfa_secret, password FROM users WHERE email = ?',
                (email,)
            )
            user = cursor.fetchone()
            if not user:
                return None
            
            stored_password = user[5]
            is_valid = False
            
            # Check if it's a hash or plain text
            if stored_password.startswith(('pbkdf2:sha256:', 'scrypt:')):
                is_valid = check_password_hash(stored_password, password)
            else:
                # Legacy plain text password - verify and migrate
                if stored_password == password:
                    is_valid = True
                    # Migrate to hash and encrypt PII immediately
                    new_hash = generate_password_hash(password)
                    enc_name = encrypt_text(user[0])
                    enc_phone = encrypt_text(user[2])
                    cursor.execute(
                        'UPDATE users SET password = ?, name = ?, phone = ? WHERE email = ?',
                        (new_hash, enc_name, enc_phone, email)
                    )
                    conn.commit()
            
            if is_valid:
                # Return decrypted data (decrypted above during migration or here)
                # decryption fallback handles if already encrypted
                return (
                    decrypt_text(user[0]), 
                    user[1], 
                    decrypt_text(user[2]), 
                    user[3], 
                    user[4]
                )
            return None

    def get_user_by_email(self, email):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT name, email, phone, mfa_enabled, mfa_secret FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()
            if user:
                return (
                    decrypt_text(user[0]),
                    user[1],
                    decrypt_text(user[2]),
                    user[3],
                    user[4]
                )
            return None

    def create_oauth_user(self, name, email):
        try:
            encrypted_name = encrypt_text(name)
            with self._get_connection(self.users_db) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO users (name, email) VALUES (?, ?)',
                    (encrypted_name, email)
                )
                conn.commit()
                return True
        except sqlite3.IntegrityError:
            return False

    def add_task(self, user_email, text, category, notes, due_date):
        with self._get_connection(self.tasks_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO tasks (user_email, text, category, notes, due_date) 
                   VALUES (?, ?, ?, ?, ?)''',
                (user_email, text, category, notes, due_date)
            )
            conn.commit()
            return cursor.lastrowid

    def get_tasks(self, user_email):
        with self._get_connection(self.tasks_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'SELECT * FROM tasks WHERE user_email = ? ORDER BY created_at DESC',
                (user_email,)
            )
            # Convert to dictionary manually since row_factory isn't set
            rows = cursor.fetchall()
            tasks = []
            for row in rows:
                tasks.append({
                    'id': row[0],
                    'user_email': row[1],
                    'text': row[2],
                    'category': row[3],
                    'notes': row[4],
                    'due_date': row[5],
                    'completed': bool(row[6]),
                    'created_at': row[7]
                })
            return tasks

    def update_task_status(self, task_id, completed):
        with self._get_connection(self.tasks_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE tasks SET completed = ? WHERE id = ?',
                (1 if completed else 0, task_id)
            )
            conn.commit()

    def enable_mfa(self, email, secret):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE users SET mfa_secret = ?, mfa_enabled = 1 WHERE email = ?',
                (secret, email)
            )
            conn.commit()

    def delete_task(self, task_id):
        with self._get_connection(self.tasks_db) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
            conn.commit()

    def add_purchase(self, user_email, item_id, amount, order_id):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO purchases (user_email, item_id, amount, razorpay_order_id, status) 
                   VALUES (?, ?, ?, ?, 'pending')''',
                (user_email, item_id, amount, order_id)
            )
            conn.commit()
            return cursor.lastrowid

    def update_purchase_success(self, order_id, payment_id):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE purchases SET razorpay_payment_id = ?, status = "completed" WHERE razorpay_order_id = ?',
                (payment_id, order_id)
            )
            conn.commit()

    def get_purchased_themes(self, user_email):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'SELECT item_id FROM purchases WHERE user_email = ? AND status = "completed"',
                (user_email,)
            )
            return [row[0] for row in cursor.fetchall()]

import sqlite3
import os

class Database:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.users_db = os.path.join(base_dir, 'users.db')
        self.tasks_db = os.path.join(base_dir, 'tasks.db')
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
                    password TEXT
                )
            ''')
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
            with self._get_connection(self.users_db) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
                    (name, email, phone, password)
                )
                conn.commit()
                return True
        except sqlite3.IntegrityError:
            return False

    def verify_user(self, email, password):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'SELECT name, email, phone FROM users WHERE email = ? AND password = ?',
                (email, password)
            )
            return cursor.fetchone()

    def get_user_by_email(self, email):
        with self._get_connection(self.users_db) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT name, email, phone FROM users WHERE email = ?', (email,))
            return cursor.fetchone()

    def create_oauth_user(self, name, email):
        try:
            with self._get_connection(self.users_db) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO users (name, email) VALUES (?, ?)',
                    (name, email)
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

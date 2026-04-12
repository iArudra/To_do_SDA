import sqlite3
import os

def dump_users():
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    if not os.path.exists(db_path):
        print("Database not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM users")
        rows = cursor.fetchall()
        
        print(f"{'ID':<5} | {'Name':<20} | {'Email':<30} | {'Phone':<15} | {'Password':<15}")
        print("-" * 90)
        
        for row in rows:
            # row format: (id, name, email, phone, password)
            pwd_display = row[4] if row[4] else "[OAuth User]"
            print(f"{row[0]:<5} | {row[1]:<20} | {row[2]:<30} | {str(row[3]):<15} | {pwd_display:<15}")
            
    except sqlite3.Error as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    dump_users()

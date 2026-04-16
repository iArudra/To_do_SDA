#!/usr/bin/env python3
"""
check_rds.py - Connectivity test for AWS RDS MySQL.
Run from the project root: python backend/check_rds.py
"""

import os
import sys
from dotenv import load_dotenv

# Load .env from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_HOST     = os.getenv('DB_HOST')
DB_PORT     = int(os.getenv('DB_PORT', 3306))
DB_NAME     = os.getenv('DB_NAME', 'tododb')
DB_USER     = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD')

print("=" * 50)
print("  AWS RDS MySQL Connection Check")
print("=" * 50)
print(f"  Host    : {DB_HOST}")
print(f"  Port    : {DB_PORT}")
print(f"  Database: {DB_NAME}")
print(f"  User    : {DB_USER}")
print(f"  Password: {'SET ✓' if DB_PASSWORD else 'MISSING ✗'}")
print("=" * 50)

# 1. Check env vars
missing = []
if not DB_HOST:     missing.append('DB_HOST')
if not DB_PASSWORD: missing.append('DB_PASSWORD')

if missing:
    print(f"\n[FAIL] Missing environment variables: {', '.join(missing)}")
    print("       Please check your .env file.\n")
    sys.exit(1)

# 2. Check PyMySQL is installed
try:
    import pymysql
    import pymysql.cursors
except ImportError:
    print("\n[FAIL] PyMySQL is not installed.")
    print("       Run: pip install PyMySQL\n")
    sys.exit(1)

# 3. Try to connect
print("\nConnecting to RDS MySQL...")
try:
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        db=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10,
        cursorclass=pymysql.cursors.DictCursor
    )

    with conn.cursor() as cur:
        # MySQL version
        cur.execute("SELECT VERSION() AS version")
        version = cur.fetchone()['version']
        print(f"\n[OK] Connected successfully!")
        print(f"     MySQL Version: {version}")

        # List existing tables
        cur.execute("SHOW TABLES")
        tables = [list(row.values())[0] for row in cur.fetchall()]

        if tables:
            print(f"\n[OK] Tables found in '{DB_NAME}':")
            for t in tables:
                print(f"     - {t}")
        else:
            print(f"\n[INFO] No tables yet in '{DB_NAME}'.")
            print("       Tables will be created automatically when the backend starts.")

    conn.close()
    print("\n[DONE] RDS MySQL is reachable and healthy. ✓\n")
    sys.exit(0)

except pymysql.err.OperationalError as e:
    print(f"\n[FAIL] Could not connect to RDS MySQL.")
    print(f"       Error: {e}")
    print("\n  Common fixes:")
    print("  1. Ensure the RDS instance status is 'Available' in AWS Console.")
    print("  2. Check port 3306 is open in the RDS Security Group (Inbound rule).")
    print("  3. Ensure 'Publicly accessible' is set to Yes on the RDS instance.")
    print("  4. Double-check DB_HOST, DB_USER, DB_PASSWORD in your .env file.\n")
    sys.exit(1)

except Exception as e:
    print(f"\n[FAIL] Unexpected error: {e}\n")
    sys.exit(1)

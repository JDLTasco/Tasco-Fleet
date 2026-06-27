#!/usr/bin/env python3
"""
Sets a real password for a migrated user.
The migration deliberately throws away the legacy 3-digit Access "password"
field and assigns every user a random unusable hash — this is how each
person gets a real one.

Usage:
    python3 set_password.py <username> <new_password>
"""
import sys
import os
import bcrypt
import psycopg2

DB_HOST = os.environ.get("FLEET_DB_HOST", "localhost")
DB_NAME = os.environ.get("FLEET_DB_NAME", "fleet_dev")
DB_USER = os.environ.get("FLEET_DB_USER", "postgres")
DB_PASS = os.environ.get("FLEET_DB_PASS", "postgres")

if len(sys.argv) != 3:
    print("Usage: python3 set_password.py <username> <new_password>")
    sys.exit(1)

username, new_password = sys.argv[1], sys.argv[2]
if len(new_password) < 8:
    print("Password must be at least 8 characters.")
    sys.exit(1)

conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
cur = conn.cursor()
hash_ = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
cur.execute("UPDATE users SET password_hash = %s WHERE username = %s RETURNING id", (hash_, username))
row = cur.fetchone()
conn.commit()

if row:
    print(f"Password updated for '{username}'.")
else:
    print(f"No user found with username '{username}'.")
cur.close()
conn.close()

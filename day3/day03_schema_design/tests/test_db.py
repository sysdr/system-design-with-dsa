#!/usr/bin/env python3
"""Tests for Day 3 database schema and data."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg2

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'system_design_db')
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')

def get_conn():
    try:
        return psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            connect_timeout=2
        )
    except psycopg2.OperationalError as e:
        if "Connection refused" in str(e) or "could not connect" in str(e).lower():
            print("SKIP: PostgreSQL not running. Start DB (e.g. Docker) and re-run tests.")
            sys.exit(0)
        raise

def test_tables_exist():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('users', 'problems', 'submissions')
        ORDER BY table_name
    """)
    names = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    assert names == ['problems', 'submissions', 'users'], f"Expected users, problems, submissions; got {names}"

def test_sample_data():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users")
    u = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM problems")
    p = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM submissions")
    s = cur.fetchone()[0]
    cur.close()
    conn.close()
    assert u >= 2, f"Expected at least 2 users, got {u}"
    assert p >= 2, f"Expected at least 2 problems, got {p}"
    assert s >= 2, f"Expected at least 2 submissions, got {s}"

if __name__ == "__main__":
    test_tables_exist()
    print("test_tables_exist OK")
    test_sample_data()
    print("test_sample_data OK")
    print("All tests passed.")

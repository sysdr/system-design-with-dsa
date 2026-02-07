#!/usr/bin/env python3
"""Display metrics dashboard for Day 3 schema design (reads from DB)."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import psycopg2
except ImportError:
    print("Install psycopg2-binary. Run: pip install psycopg2-binary")
    sys.exit(1)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'system_design_db')
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')

def get_metrics():
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME,
            user=DB_USER, password=DB_PASSWORD
        )
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users")
        users = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM problems")
        problems = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM submissions")
        submissions = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM submissions WHERE status = 'accepted'")
        accepted = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM submissions WHERE status = 'pending'")
        pending = cur.fetchone()[0]
        cur.close()
        conn.close()
        return {"users": users, "problems": problems, "submissions": submissions, "accepted": accepted, "pending": pending}
    except Exception as e:
        return {"error": str(e), "users": 0, "problems": 0, "submissions": 0, "accepted": 0, "pending": 0}

def main():
    m = get_metrics()
    if m.get("error"):
        print("Dashboard: DB error:", m["error"])
        print("  users: 0, problems: 0, submissions: 0")
        return
    print("=== Day 3 Schema Design Dashboard ===")
    print(f"  Users:       {m['users']}")
    print(f"  Problems:    {m['problems']}")
    print(f"  Submissions: {m['submissions']} (accepted: {m['accepted']}, pending: {m['pending']})")
    print("=====================================")

if __name__ == "__main__":
    main()

import os
import json
import psycopg2
from psycopg2 import sql
from psycopg2.extras import Json
from uuid import uuid4
import time

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'system_design_db')
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')

def get_db_connection():
    """Establishes and returns a database connection."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except psycopg2.OperationalError as e:
        print(f"Database connection failed: {e}")
        exit(1)

def create_schema(conn):
    """Creates tables and types based on our design."""
    print("  Creating database schema...")
    with conn.cursor() as cur:
        # Drop tables/types if they exist (for easy re-runs)
        cur.execute("DROP TABLE IF EXISTS submissions CASCADE;")
        cur.execute("DROP TABLE IF EXISTS problems CASCADE;")
        cur.execute("DROP TABLE IF EXISTS users CASCADE;")
        cur.execute("DROP TYPE IF EXISTS submission_status CASCADE;")

        # Create ENUM type for submission status
        cur.execute("""
            CREATE TYPE submission_status AS ENUM (
                'pending', 'running', 'accepted', 'wrong_answer',
                'time_limit_exceeded', 'memory_limit_exceeded',
                'compilation_error', 'runtime_error', 'internal_error'
            );
        """)

        # Create users table
        cur.execute("""
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("CREATE INDEX idx_users_status ON users(status);")

        # Create problems table
        cur.execute("""
            CREATE TABLE problems (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) UNIQUE NOT NULL,
                description TEXT NOT NULL,
                difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
                tags TEXT[],
                test_cases JSONB NOT NULL,
                starter_code JSONB,
                time_limit_ms INT NOT NULL DEFAULT 1000,
                memory_limit_kb INT NOT NULL DEFAULT 256000,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("CREATE INDEX idx_problems_difficulty ON problems(difficulty);")
        cur.execute("CREATE INDEX idx_problems_tags ON problems USING GIN (tags);")

        # Create submissions table
        cur.execute("""
            CREATE TABLE submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
                language VARCHAR(50) NOT NULL,
                code TEXT NOT NULL,
                status submission_status DEFAULT 'pending',
                runtime_ms INT,
                memory_usage_kb INT,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                judged_at TIMESTAMP WITH TIME ZONE
            );
        """)
        cur.execute("CREATE INDEX idx_submissions_user_id ON submissions(user_id);")
        cur.execute("CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);")
        cur.execute("CREATE INDEX idx_submissions_status ON submissions(status);")
        cur.execute("CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id, submitted_at DESC);")
        conn.commit()
    print("  Schema created successfully!")

def insert_sample_data(conn):
    """Inserts sample data into the tables."""
    print("  Inserting sample data...")
    # Use string UUIDs so psycopg2 can adapt them to PostgreSQL UUID type
    user1_id = str(uuid4())
    user2_id = str(uuid4())
    problem1_id = str(uuid4())
    problem2_id = str(uuid4())
    with conn.cursor() as cur:
        # Insert users
        cur.execute(
            sql.SQL("INSERT INTO users (id, username, email, password_hash, is_admin) VALUES (%s, %s, %s, %s, %s);"),
            (user1_id, 'alice_dev', 'alice@example.com', 'hashed_password_alice', True)
        )
        cur.execute(
            sql.SQL("INSERT INTO users (id, username, email, password_hash, is_admin) VALUES (%s, %s, %s, %s, %s);"),
            (user2_id, 'bob_coder', 'bob@example.com', 'hashed_password_bob', False)
        )

        # Insert problems (use Json for JSONB columns)
        cur.execute(
            sql.SQL("INSERT INTO problems (id, title, description, difficulty, tags, test_cases, time_limit_ms, memory_limit_kb) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);"),
            (problem1_id, 'Two Sum', 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.', 'easy', ['array', 'hash-table'], Json([{'input': '[2,7,11,15]n9', 'output': '[0,1]'}]), 1000, 128000)
        )
        cur.execute(
            sql.SQL("INSERT INTO problems (id, title, description, difficulty, tags, test_cases, starter_code, time_limit_ms, memory_limit_kb) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);"),
            (problem2_id, 'Longest Palindromic Substring', 'Given a string s, return the longest palindromic substring in s.', 'medium', ['string', 'dynamic-programming'], Json([{'input': '"babad"', 'output': '"bab"'}]), Json({'python': 'def longestPalindrome(s: str) -> str:n    pass'}), 2000, 256000)
        )

        # Insert submissions
        cur.execute(
            sql.SQL("INSERT INTO submissions (user_id, problem_id, language, code, status, runtime_ms, memory_usage_kb) VALUES (%s, %s, %s, %s, %s, %s, %s);"),
            (user1_id, problem1_id, 'python', 'def two_sum(nums, target):n    # ... implementation ...', 'accepted', 50, 10240)
        )
        cur.execute(
            sql.SQL("INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (%s, %s, %s, %s, %s);"),
            (user1_id, problem2_id, 'java', 'class Solution { ... }', 'pending')
        )
        cur.execute(
            sql.SQL("INSERT INTO submissions (user_id, problem_id, language, code, status, runtime_ms, memory_usage_kb) VALUES (%s, %s, %s, %s, %s, %s, %s);"),
            (user2_id, problem1_id, 'cpp', '#include <vector>n// ...', 'wrong_answer', 70, 15360)
        )
        conn.commit()
    print("  Sample data inserted.")
    return user1_id, problem1_id

def verify_data(conn, user_id, problem_id):
    """Performs queries to verify data and schema."""
    print("n--- Verification: Querying Data ---")
    with conn.cursor() as cur:
        print("n  All Users:")
        cur.execute("SELECT id, username, email, is_admin FROM users;")
        for row in cur.fetchall():
            print(f"    User ID: {row[0]}, Username: {row[1]}, Email: {row[2]}, Admin: {row[3]}")

        print("n  All Problems:")
        cur.execute("SELECT id, title, difficulty, tags, test_cases->>0 FROM problems;")
        for row in cur.fetchall():
            print(f"    Problem ID: {row[0]}, Title: {row[1]}, Difficulty: {row[2]}, Tags: {row[3]}, First Test Case (Input): {row[4]}")

        print(f"n  Submissions by User (ID: {user_id}):")
        cur.execute(
            sql.SQL("SELECT s.id, p.title, s.language, s.status, s.runtime_ms, s.submitted_at FROM submissions s JOIN problems p ON s.problem_id = p.id WHERE s.user_id = %s ORDER BY s.submitted_at DESC;"),
            (user_id,)
        )
        for row in cur.fetchall():
            print(f"    Submission ID: {row[0]}, Problem: {row[1]}, Lang: {row[2]}, Status: {row[3]}, Runtime: {row[4]}ms, Submitted: {row[5]}")

        print(f"n  Submissions for Problem (ID: {problem_id}):")
        cur.execute(
            sql.SQL("SELECT s.id, u.username, s.language, s.status, s.memory_usage_kb FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.problem_id = %s ORDER BY s.submitted_at DESC;"),
            (problem_id,)
        )
        for row in cur.fetchall():
            print(f"    Submission ID: {row[0]}, User: {row[1]}, Lang: {row[2]}, Status: {row[3]}, Memory: {row[4]}kb")

    print("n--- Verification Complete ---")

if __name__ == "__main__":
    print("Connecting to database...")
    conn = get_db_connection()
    try:
        create_schema(conn)
        user_id, problem_id = insert_sample_data(conn)
        verify_data(conn, user_id, problem_id)
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

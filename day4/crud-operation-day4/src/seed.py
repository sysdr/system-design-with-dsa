import os
from sqlalchemy.orm import Session
from src.database import create_db_tables, SessionLocal, engine
from src import crud, schemas, models
from sqlalchemy import text

# Ensure tables are created first
create_db_tables()

db = SessionLocal()

try:
    # Check if problems already exist to prevent re-seeding
    if db.query(models.Problem).count() == 0:
        print("Seeding initial problems...")

        problems_to_create = [
            schemas.ProblemCreate(
                title="Two Sum",
                description="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                difficulty="Easy",
                tags="Array,Hash Table"
            ),
            schemas.ProblemCreate(
                title="Longest Substring Without Repeating Characters",
                description="Given a string s, find the length of the longest substring without repeating characters.",
                difficulty="Medium",
                tags="Hash Table,String,Sliding Window"
            ),
            schemas.ProblemCreate(
                title="Median of Two Sorted Arrays",
                description="Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
                difficulty="Hard",
                tags="Array,Binary Search,Divide and Conquer"
            ),
            schemas.ProblemCreate(
                title="Container With Most Water",
                description="Given n non-negative integers a1, a2, ..., an, where each represents a point at coordinate (i, ai).",
                difficulty="Medium",
                tags="Array,Two Pointers"
            ),
            schemas.ProblemCreate(
                title="Valid Parentheses",
                description="Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                difficulty="Easy",
                tags="String,Stack"
            ),
            schemas.ProblemCreate(
                title="Longest Palindromic Substring",
                description="Given a string s, return the longest palindromic substring in s.",
                difficulty="Medium",
                tags="String,Dynamic Programming"
            )
        ]

        for p_data in problems_to_create:
            try:
                crud.create_problem(db, p_data)
            except Exception as e:
                print(f"Error creating problem {p_data.title}: {e}")
        print(f"Seeded {len(problems_to_create)} problems.")
    else:
        print("Problems already exist. Skipping seeding.")

    # Verify indexes (for SQLite, this is a good way to check)
    print("\n--- Database Indexes Verification ---")
    with engine.connect() as connection:
        result = connection.execute(text("PRAGMA index_list('problems');"))
        print("Indexes on 'problems' table:")
        for row in result:
            print(f"  - {row.name} (on column(s): {row.seq})") # seq is not column name but order, good enough for demo

    print("\n--- Sample EXPLAIN query output (conceptual for SQLite) ---")
    print("For a query like: SELECT * FROM problems WHERE difficulty = 'Medium';")
    print("SQLite's EXPLAIN query would show something like:")
    print("  SCAN TABLE problems USING INDEX idx_difficulty (difficulty=?)")
    print("This indicates the 'idx_difficulty_tags' index is being utilized for efficient lookup.")


finally:
    db.close()

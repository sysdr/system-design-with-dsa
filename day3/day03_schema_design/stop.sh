#!/bin/bash
# Stop and remove the PostgreSQL container for Day 3 schema design.
set -e
DB_CONTAINER_NAME="day03_postgres_db"
docker stop "$DB_CONTAINER_NAME" 2>/dev/null || true
docker rm "$DB_CONTAINER_NAME" 2>/dev/null || true
echo "Database container stopped and removed."

#!/bin/bash
# Stop Day 3 containers and remove unused Docker resources (volumes, containers, images).
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_CONTAINER_NAME="day03_postgres_db"

echo "=== Day 3 Cleanup ==="

# Stop and remove project container if present
if docker ps -aq -f name="^${DB_CONTAINER_NAME}$" 2>/dev/null | grep -q .; then
  echo "Stopping and removing container: $DB_CONTAINER_NAME"
  docker stop "$DB_CONTAINER_NAME" 2>/dev/null || true
  docker rm "$DB_CONTAINER_NAME" 2>/dev/null || true
fi

# Remove unused Docker resources
echo "Removing unused Docker resources..."
docker system prune -f --volumes 2>/dev/null || true
docker container prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
docker image prune -f 2>/dev/null || true

echo "Cleanup complete."

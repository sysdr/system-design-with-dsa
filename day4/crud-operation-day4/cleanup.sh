#!/bin/bash
# Cleanup: stop app and Docker, remove unused Docker resources, clean project artifacts.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "[INFO] Stopping application..."
[ -f ./stop.sh ] && bash ./stop.sh 2>/dev/null || true

echo "[INFO] Stopping Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

echo "[INFO] Removing unused Docker resources (containers, images, volumes, networks)..."
docker system prune -af --volumes 2>/dev/null || true

echo "[INFO] Removing project artifacts (node_modules, venv, .pytest_cache, __pycache__, .pyc, vendor, *.rr)..."
rm -rf venv
rm -rf node_modules
rm -rf .pytest_cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -type d -name vendor -exec rm -rf {} + 2>/dev/null || true
find . -name "*.rr" -delete 2>/dev/null || true

echo "[INFO] Cleanup done. Re-run setup.sh from day4 to recreate venv and run the app."

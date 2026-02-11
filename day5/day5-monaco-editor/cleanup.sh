#!/bin/bash
# Cleanup: stop app and Docker, remove unused Docker resources, clean project artifacts.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "[INFO] Stopping application..."
[ -f ./stop.sh ] && bash ./stop.sh 2>/dev/null || true

echo "[INFO] Stopping Docker containers..."
for c in $(docker ps -aq 2>/dev/null); do docker stop "$c" 2>/dev/null || true; done
for c in $(docker ps -aq 2>/dev/null); do docker rm "$c" 2>/dev/null || true; done

echo "[INFO] Stopping project Docker stack..."
docker-compose -f docker-compose.yml down -v 2>/dev/null || true

echo "[INFO] Removing unused Docker resources (containers, images, volumes, networks)..."
docker system prune -af --volumes 2>/dev/null || true

echo "[INFO] Removing project artifacts (node_modules, .cache, venv, .pytest_cache, __pycache__, .pyc, vendor, istio, *.rr)..."
rm -rf "$PROJECT_DIR/backend/node_modules"
rm -rf "$PROJECT_DIR/frontend/node_modules"
rm -rf "$PROJECT_DIR/frontend/.cache"
rm -rf "$PROJECT_DIR/venv"
rm -rf "$PROJECT_DIR/.pytest_cache"
find "$PROJECT_DIR" -depth -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_DIR" -name "*.pyc" -delete 2>/dev/null || true
find "$PROJECT_DIR" -depth -type d -name vendor -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_DIR" -depth -type d -iname "*istio*" -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_DIR" -name "*.rr" -delete 2>/dev/null || true
rm -f "$PROJECT_DIR/.start.lock"

echo "[DONE] Cleanup complete. Re-run setup.sh from day5 to regenerate, then ./start.sh to run."

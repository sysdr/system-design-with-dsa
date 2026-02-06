#!/bin/bash
# Cleanup: stop containers, remove unused Docker resources, volumes, containers, images.
# Then remove node_modules, venv, .pytest_cache, .pyc, Istio, vendor, .rr files.
# Run from monorepo-day2 directory or by full path.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "[cleanup] Project dir: $PROJECT_DIR"

# --- 1. Stop dashboard / local services (port 3002, lock files) ---
if command -v lsof &>/dev/null; then
  for pid in $(lsof -ti :3002 2>/dev/null); do
    echo "[cleanup] Stopping process on port 3002 (PID $pid)..."
    kill "$pid" 2>/dev/null || true
  done
  sleep 1
fi
rm -f "$PROJECT_DIR/.start.lock" 2>/dev/null || true

# --- 2. Stop Docker containers and remove unused Docker resources ---
if command -v docker &>/dev/null; then
  echo "[cleanup] Stopping Docker containers..."
  docker stop monorepo-day2-container 2>/dev/null || true
  docker rm monorepo-day2-container 2>/dev/null || true
  docker rmi monorepo-day2-app 2>/dev/null || true
  echo "[cleanup] Removing unused Docker resources (containers, images, volumes)..."
  docker system prune -af --volumes 2>/dev/null || true
  echo "[cleanup] Docker cleanup done."
else
  echo "[cleanup] Docker not found, skipping Docker cleanup."
fi

# --- 3. Remove node_modules, venv, .pytest_cache, .pyc, Istio, vendor, .rr ---
for dir in node_modules venv .pytest_cache __pycache__ istio vendor; do
  find "$PROJECT_DIR" -maxdepth 6 -type d -name "$dir" 2>/dev/null | while read -r d; do
    echo "[cleanup] Removing $d ..."
    rm -rf "$d"
  done
done

find "$PROJECT_DIR" -type f -name "*.pyc" 2>/dev/null | while read -r f; do
  echo "[cleanup] Removing $f"
  rm -f "$f"
done

find "$PROJECT_DIR" -type f -name "*.rr" 2>/dev/null | while read -r f; do
  echo "[cleanup] Removing $f"
  rm -f "$f"
done

echo "[cleanup] Cleanup finished."

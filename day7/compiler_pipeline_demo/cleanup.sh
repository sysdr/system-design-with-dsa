#!/bin/bash
# Cleanup: stop this project's services, stop Docker containers, remove unused
# Docker resources; then remove node_modules, venv, .pytest_cache, .pyc, Istio
# from this project directory. Run from compiler_pipeline_demo or by full path.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "[cleanup] Project dir: $PROJECT_DIR"

# --- 1. Stop this project's service (port 3007, stop.sh) ---
if [ -x "$PROJECT_DIR/stop.sh" ]; then
  echo "[cleanup] Running stop.sh..."
  "$PROJECT_DIR/stop.sh" 2>/dev/null || true
fi
PORT="${PORT:-3007}"
if command -v lsof &>/dev/null; then
  for pid in $(lsof -ti :$PORT 2>/dev/null); do
    echo "[cleanup] Stopping process on port $PORT (PID $pid)..."
    kill "$pid" 2>/dev/null || true
  done
fi
sleep 1
rm -f "$PROJECT_DIR/.start.lock" 2>/dev/null || true

# --- 2. Stop Docker containers and remove unused resources ---
if command -v docker &>/dev/null; then
  echo "[cleanup] Stopping all Docker containers..."
  docker stop $(docker ps -q) 2>/dev/null || true
  echo "[cleanup] Removing stopped containers..."
  docker container prune -f 2>/dev/null || true
  echo "[cleanup] Removing unused images..."
  docker image prune -af 2>/dev/null || true
  echo "[cleanup] Removing unused Docker resources (networks, build cache)..."
  docker system prune -af 2>/dev/null || true
  echo "[cleanup] Docker cleanup done."
else
  echo "[cleanup] Docker not found, skipping Docker cleanup."
fi

# --- 3. Remove node_modules, venv, .pytest_cache, __pycache__, .pyc, Istio (within this project only) ---
for dir in node_modules venv .venv .pytest_cache __pycache__ istio vendor; do
  find "$PROJECT_DIR" -type d -name "$dir" 2>/dev/null | while IFS= read -r d; do
    echo "[cleanup] Removing $d"
    rm -rf "$d"
  done
done

find "$PROJECT_DIR" -type f -name "*.pyc" 2>/dev/null | while IFS= read -r f; do
  echo "[cleanup] Removing $f"
  rm -f "$f"
done

find "$PROJECT_DIR" -type d -name "*istio*" 2>/dev/null | while IFS= read -r d; do
  echo "[cleanup] Removing $d"
  rm -rf "$d"
done
find "$PROJECT_DIR" -type f -path "*istio*" 2>/dev/null | while IFS= read -r f; do
  echo "[cleanup] Removing $f"
  rm -f "$f"
done

echo "[cleanup] Done."

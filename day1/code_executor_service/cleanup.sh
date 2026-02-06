#!/bin/bash
# Cleanup: stop containers, remove unused Docker resources, remove node_modules/venv/cache artifacts.
# Run from code_executor_service directory or by full path.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "[cleanup] Project dir: $PROJECT_DIR"

# --- 1. Stop local demo service (lock file) ---
LOCK_FILE="$PROJECT_DIR/.demo.lock"
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo "[cleanup] Stopping demo service (PID $PID)..."
        kill "$PID" 2>/dev/null || true
        sleep 1
        kill -9 "$PID" 2>/dev/null || true
    fi
    rm -f "$LOCK_FILE"
    echo "[cleanup] Removed .demo.lock"
fi

# --- 2. Stop Docker containers and remove unused Docker resources ---
if command -v docker &>/dev/null; then
    echo "[cleanup] Stopping Docker containers..."
    docker stop $(docker ps -q 2>/dev/null) 2>/dev/null || true
    echo "[cleanup] Removing unused Docker resources (containers, images, volumes)..."
    docker system prune -af --volumes 2>/dev/null || true
    echo "[cleanup] Docker cleanup done."
else
    echo "[cleanup] Docker not found, skipping Docker cleanup."
fi

# --- 3. Remove node_modules, venv, .pytest_cache, .pyc, Istio, vendor, rr files ---
REMOVED=0

for dir in node_modules venv .pytest_cache __pycache__ istio vendor; do
    if [ -d "$PROJECT_DIR/$dir" ]; then
        echo "[cleanup] Removing $dir/ ..."
        rm -rf "$PROJECT_DIR/$dir"
        REMOVED=1
    fi
    # Also find and remove in subdirs
    find "$PROJECT_DIR" -maxdepth 5 -type d -name "$dir" 2>/dev/null | while read -r d; do
        echo "[cleanup] Removing $d ..."
        rm -rf "$d"
    done
done

find "$PROJECT_DIR" -type f -name "*.pyc" 2>/dev/null | while read -r f; do
    echo "[cleanup] Removing $f"
    rm -f "$f"
    REMOVED=1
done

find "$PROJECT_DIR" -type f -name "*.rr" 2>/dev/null | while read -r f; do
    echo "[cleanup] Removing $f"
    rm -f "$f"
    REMOVED=1
done

if [ "$REMOVED" = "0" ] && ! find "$PROJECT_DIR" -type d -name "node_modules" -o -type d -name "venv" -o -type d -name ".pytest_cache" 2>/dev/null | grep -q .; then
    echo "[cleanup] No node_modules, venv, .pytest_cache, .pyc, istio, vendor, or .rr files found to remove."
else
    echo "[cleanup] Artifact cleanup done."
fi

echo "[cleanup] Cleanup finished."

#!/bin/bash
# Run from code_executor_service directory (or by full path). Uses full path to worker and dashboard.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_SCRIPT="$PROJECT_DIR/src/worker.py"
DASHBOARD_SCRIPT="$PROJECT_DIR/dashboard.py"
LOCK_FILE="$PROJECT_DIR/.demo.lock"

# Check for duplicate: avoid running demo if already running
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "[WARN] Demo may already be running (PID $PID). Skip or kill it first."
        exit 1
    fi
    rm -f "$LOCK_FILE"
fi

if [ ! -f "$WORKER_SCRIPT" ]; then
    echo "[ERROR] Worker not found: $WORKER_SCRIPT. Run setup.sh first."
    exit 1
fi

echo "$BASHPID" > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

echo "--- Running Demo (worker) ---"
python3 "$WORKER_SCRIPT"
echo ""
echo "--- Dashboard ---"
python3 "$DASHBOARD_SCRIPT"

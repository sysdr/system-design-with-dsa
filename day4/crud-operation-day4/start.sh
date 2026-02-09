#!/bin/bash
# Run from crud-operation-day4 or by full path. Starts API, seeds DB, dashboard.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCK_FILE="$PROJECT_DIR/.start.lock"
VENV_ACTIVATE="$PROJECT_DIR/venv/bin/activate"
FASTAPI_PORT="${FASTAPI_PORT:-8000}"

if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[WARN] Application may already be running (PID $PID). Run ./stop.sh first."
    exit 1
  fi
  rm -f "$LOCK_FILE"
fi

cd "$PROJECT_DIR" || exit 1
if [ ! -f "$VENV_ACTIVATE" ]; then
  echo "[ERROR] venv not found. Run setup.sh from day4 first: cd day4 && ./setup.sh"
  exit 1
fi

# Avoid duplicate: port in use
if command -v curl >/dev/null 2>&1; then
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FASTAPI_PORT/" 2>/dev/null | grep -q "200"; then
    echo "[WARN] Service already responding on port $FASTAPI_PORT. Run ./stop.sh first."
    exit 1
  fi
fi

echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

source "$VENV_ACTIVATE"
export DB_FILE="${DB_FILE:-instance.db}"
PYTHON="$PROJECT_DIR/venv/bin/python3"

echo "[INFO] Initializing DB and seeding..."
(cd "$PROJECT_DIR" && "$PYTHON" -m src.database) || { echo "[ERROR] DB init failed."; exit 1; }
(cd "$PROJECT_DIR" && "$PYTHON" -m src.seed) || { echo "[ERROR] Seed failed."; exit 1; }

echo "[INFO] Starting FastAPI on http://localhost:$FASTAPI_PORT"
(cd "$PROJECT_DIR" && "$PYTHON" -m uvicorn src.main:app --host 0.0.0.0 --port "$FASTAPI_PORT") &
echo $! > "$PROJECT_DIR/.uvicorn_pid"
sleep 3
curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FASTAPI_PORT/" | grep -q "200" || { echo "[ERROR] API did not start."; exit 1; }
echo "[INFO] Dashboard: http://localhost:$FASTAPI_PORT/dashboard"
echo "Done. Open http://localhost:$FASTAPI_PORT/dashboard for metrics."

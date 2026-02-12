#!/bin/bash
# Run from day6_uploads or by full path. Starts upload server. Checks for duplicate services.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"
LOCK_FILE="$PROJECT_DIR/.start.lock"

if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[WARN] Server may already be running (PID $PID). Run ./stop.sh first."
    exit 1
  fi
  rm -f "$LOCK_FILE"
fi

if command -v curl >/dev/null 2>&1; then
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/metrics" 2>/dev/null | grep -q "200"; then
    echo "[WARN] Server already responding on port $PORT. Run ./stop.sh first."
    exit 1
  fi
fi

cd "$PROJECT_DIR" || exit 1

echo "[INFO] Starting upload server on http://localhost:$PORT"
node "$PROJECT_DIR/server/index.js" &
SERVER_PID=$!
echo $SERVER_PID > "$LOCK_FILE"
sleep 2
echo "[INFO] Dashboard: http://localhost:$PORT/dashboard"
echo "[INFO] Submit form: http://localhost:$PORT/index.html"
echo "Done. Open http://localhost:$PORT/dashboard for metrics."

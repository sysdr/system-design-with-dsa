#!/bin/bash
# Run from day5 or by full path. Starts backend + frontend (local) or docker-compose. Checks for duplicate services.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
LOCK_FILE="$PROJECT_DIR/.start.lock"

if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[WARN] Application may already be running (PID $PID). Run ./stop.sh first."
    exit 1
  fi
  rm -f "$LOCK_FILE"
fi

cd "$PROJECT_DIR" || exit 1

# Avoid duplicate: port in use
if command -v curl >/dev/null 2>&1; then
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/api/metrics" 2>/dev/null | grep -q "200"; then
    echo "[WARN] Backend already responding on port $BACKEND_PORT. Run ./stop.sh first."
    exit 1
  fi
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT/" 2>/dev/null | grep -q "200"; then
    echo "[WARN] Frontend already responding on port $FRONTEND_PORT. Run ./stop.sh first."
    exit 1
  fi
fi

echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

if [ -d "$PROJECT_DIR/backend" ] && [ -d "$PROJECT_DIR/frontend" ]; then
  [ ! -d "$PROJECT_DIR/backend/node_modules" ] && echo "[INFO] Installing backend dependencies..." && (cd "$PROJECT_DIR/backend" && npm install) || true
  [ ! -d "$PROJECT_DIR/frontend/node_modules" ] && echo "[INFO] Installing frontend dependencies..." && (cd "$PROJECT_DIR/frontend" && npm install) || true
  echo "[INFO] Starting backend on http://localhost:$BACKEND_PORT"
  (cd "$PROJECT_DIR/backend" && npm start &) &
  sleep 3
  echo "[INFO] Starting frontend on http://localhost:$FRONTEND_PORT"
  (cd "$PROJECT_DIR/frontend" && npm start &) &
  sleep 5
  echo "[INFO] Dashboard: http://localhost:$BACKEND_PORT/dashboard"
  echo "Done. Open http://localhost:$BACKEND_PORT/dashboard for metrics, http://localhost:$FRONTEND_PORT for editor."
else
  echo "[INFO] Running docker-compose..."
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d
  echo "[INFO] Dashboard: http://localhost:$BACKEND_PORT/dashboard"
  echo "Done. Open http://localhost:$BACKEND_PORT/dashboard for metrics."
fi

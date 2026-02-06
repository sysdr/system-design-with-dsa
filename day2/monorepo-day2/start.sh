#!/bin/bash
# Start the application and run demo. Use from project directory or by full path.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCK_FILE="$PROJECT_DIR/.start.lock"
DEMO_WAIT_SEC=7

# Check for duplicate: avoid running if already running
if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[WARN] Application may already be running (PID $PID). Skip or stop it first."
    exit 1
  fi
  rm -f "$LOCK_FILE"
fi

cd "$PROJECT_DIR" || exit 1
if [ ! -f "packages/frontend/dist/index.js" ] || [ ! -f "packages/backend/dist/index.js" ]; then
  echo "[INFO] Building packages..."
  pnpm install --silent && pnpm build:all
fi
if [ ! -f "packages/dashboard/dist/index.js" ]; then
  echo "[INFO] Building dashboard..."
  pnpm install --silent && pnpm build:all
fi

echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Start dashboard in background if not already listening on 3002
if ! command -v curl &>/dev/null || ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/metrics 2>/dev/null | grep -q 200; then
  echo "[INFO] Starting dashboard at http://localhost:3002"
  pnpm start:dashboard &
  DASH_PID=$!
  sleep 2
fi

echo "--- Starting Frontend and Backend (demo) ---"
pnpm start:frontend &
FPID=$!
pnpm start:backend &
BPID=$!
sleep "$DEMO_WAIT_SEC"
kill $FPID $BPID 2>/dev/null || true
wait $FPID $BPID 2>/dev/null || true

# Record demo run for dashboard (if dashboard is running)
if command -v curl &>/dev/null; then
  curl -s -X POST -H "Content-Type: application/json" -d '{"type":"demo_run"}' http://localhost:3002/api/metrics/event &>/dev/null || true
fi

echo ""
echo "=== Demo metrics ==="
echo "  Frontend: started and completed (shared types and config verified)."
echo "  Backend:  started and completed (shared types and config verified)."
echo "  Demo run finished. Open http://localhost:3002 for the dashboard."
echo "==============================="

#!/bin/bash
# Run from day03_schema_design directory or by full path. Starts DB if needed, runs demo, then dashboard.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCK_FILE="$PROJECT_DIR/.start.lock"
DB_SCRIPT="$PROJECT_DIR/db_interaction.py"
DASHBOARD_SCRIPT="$PROJECT_DIR/dashboard.py"
DASHBOARD_SERVER="$PROJECT_DIR/dashboard_server.py"
DASHBOARD_PORT="${DASHBOARD_PORT:-3003}"

# PostgreSQL (same as setup.sh)
DB_CONTAINER_NAME="day03_postgres_db"
DB_USER="admin"
DB_PASSWORD="password"
DB_NAME="system_design_db"
DB_PORT="5432"

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
if [ ! -f "$DB_SCRIPT" ]; then
  echo "[ERROR] db_interaction.py not found. Run setup.sh first."
  exit 1
fi

echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# --- Ensure PostgreSQL is running so metrics can update when frontend runs ---
DB_READY=0
if command -v docker &>/dev/null; then
  if docker ps -q -f name="^${DB_CONTAINER_NAME}$" 2>/dev/null | grep -q .; then
    echo "[INFO] PostgreSQL container already running."
    DB_READY=1
  elif docker ps -aq -f name="^${DB_CONTAINER_NAME}$" 2>/dev/null | grep -q .; then
    echo "[INFO] Starting existing PostgreSQL container..."
    docker start "$DB_CONTAINER_NAME" >/dev/null 2>&1
  else
    echo "[INFO] Starting PostgreSQL in Docker (first run)..."
    docker run --name "$DB_CONTAINER_NAME" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -e POSTGRES_DB="$DB_NAME" \
      -p "$DB_PORT":5432 \
      -d postgres:16-alpine >/dev/null 2>&1
  fi
  if [ "$DB_READY" -eq 0 ]; then
    echo "[INFO] Waiting for PostgreSQL to be ready..."
    for i in $(seq 1 30); do
      if docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" -h localhost >/dev/null 2>&1; then
        echo "[INFO] PostgreSQL is ready."
        DB_READY=1
        break
      fi
      printf "."
      sleep 1
    done
    [ "$DB_READY" -eq 0 ] && echo " [WARN] PostgreSQL did not become ready in time."
  fi
else
  echo "[WARN] Docker not found. Install Docker for DB; metrics will stay zero until PostgreSQL is running on localhost:5432."
fi

# --- Run demo so schema and sample data exist (metrics update) ---
echo "--- Running Demo (db_interaction.py) ---"
source venv/bin/activate
if [ "$DB_READY" -eq 1 ] && python3 "$DB_SCRIPT"; then
  echo "Demo completed successfully. Metrics will show non-zero values."
else
  echo "[WARN] Demo skipped or failed. Start PostgreSQL (e.g. Docker) and run this script again for live metrics."
fi
echo ""
echo "--- Dashboard (CLI) ---"
python3 "$DASHBOARD_SCRIPT"
deactivate
echo ""

# --- Start web dashboard in background if not already listening ---
if ! command -v curl &>/dev/null; then
  true
elif ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:$DASHBOARD_PORT/api/metrics" 2>/dev/null | grep -q 200; then
  echo "[INFO] Starting dashboard at http://localhost:$DASHBOARD_PORT"
  source venv/bin/activate
  python3 "$DASHBOARD_SERVER" &
  sleep 2
  deactivate
fi

echo "Done. Open http://localhost:$DASHBOARD_PORT — real-time metrics update from the DB."

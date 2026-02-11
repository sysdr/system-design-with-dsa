#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
cd "$PROJECT_DIR" || exit 1
pkill -f "node.*$PROJECT_DIR/backend" 2>/dev/null || true
pkill -f "react-scripts.*$PROJECT_DIR/frontend" 2>/dev/null || true
pkill -f "node.*$PROJECT_DIR/frontend" 2>/dev/null || true
lsof -ti:$BACKEND_PORT 2>/dev/null | xargs -r kill 2>/dev/null || true
lsof -ti:$FRONTEND_PORT 2>/dev/null | xargs -r kill 2>/dev/null || true
docker-compose -f "$PROJECT_DIR/docker-compose.yml" down 2>/dev/null || true
rm -f "$PROJECT_DIR/.start.lock"
echo "Stopped services. Done."

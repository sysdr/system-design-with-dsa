#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3007}"
cd "$PROJECT_DIR" || exit 1
pkill -f "node.*$PROJECT_DIR/server" 2>/dev/null || true
lsof -ti:$PORT 2>/dev/null | xargs -r kill 2>/dev/null || true
rm -f "$PROJECT_DIR/.start.lock"
echo "Stopped. Done."

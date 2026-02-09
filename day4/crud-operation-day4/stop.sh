#!/bin/bash
# Stop native uvicorn and Docker container for Day 4 problem-manager.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
if [ -f .uvicorn_pid ]; then
  PID=$(cat .uvicorn_pid)
  kill "$PID" 2>/dev/null || true
  rm -f .uvicorn_pid
  echo "Stopped uvicorn (PID $PID)."
fi
docker stop problem-manager-container 2>/dev/null || true
docker rm problem-manager-container 2>/dev/null || true
echo "Stopped Docker container (if any). Done."

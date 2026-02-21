#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3008}"
BASE="http://localhost:$PORT"
echo "Testing $BASE ..."
curl -sf "$BASE/api/metrics" | grep -q "linesProcessed" || { echo "FAIL: GET /api/metrics"; exit 1; }
echo "OK: GET /api/metrics"
curl -sf -X POST "$BASE/api/demo" | grep -q "demosRun" || { echo "FAIL: POST /api/demo"; exit 1; }
echo "OK: POST /api/demo"
curl -sf "$BASE/dashboard" | grep -q "Dashboard" || { echo "FAIL: GET /dashboard"; exit 1; }
echo "OK: GET /dashboard"
echo "All tests passed."

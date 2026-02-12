#!/bin/bash
# Run API tests (server must be running on PORT)
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"
BASE="http://localhost:$PORT"
echo "Testing $BASE ..."
curl -sf "$BASE/api/metrics" | grep -q "submissions" || { echo "FAIL: GET /api/metrics"; exit 1; }
echo "OK: GET /api/metrics"
curl -sf -X POST "$BASE/api/demo" | grep -q "filesUploaded" || { echo "FAIL: POST /api/demo"; exit 1; }
echo "OK: POST /api/demo"
curl -sf "$BASE/dashboard" | grep -q "Dashboard" || { echo "FAIL: GET /dashboard"; exit 1; }
echo "OK: GET /dashboard"
curl -sf "$BASE/index.html" | grep -q "Submit" || { echo "FAIL: GET /index.html"; exit 1; }
echo "OK: GET /index.html"
echo "All tests passed."

#!/bin/bash
# Run API tests (backend must be running on BACKEND_PORT)
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3001}"
BASE="http://localhost:$BACKEND_PORT"
echo "Testing $BASE ..."
curl -sf "$BASE/api/problems" | grep -q "Two Sum" || { echo "FAIL: GET /api/problems"; exit 1; }
echo "OK: GET /api/problems"
curl -sf "$BASE/api/problems/1" | grep -q "Two Sum" || { echo "FAIL: GET /api/problems/1"; exit 1; }
echo "OK: GET /api/problems/1"
curl -sf "$BASE/api/metrics" | grep -q "problems" || { echo "FAIL: GET /api/metrics"; exit 1; }
echo "OK: GET /api/metrics"
curl -sf -X POST "$BASE/api/demo" | grep -q "draftsSaved" || { echo "FAIL: POST /api/demo"; exit 1; }
echo "OK: POST /api/demo"
curl -sf "$BASE/dashboard" | grep -q "About this application" || { echo "FAIL: GET /dashboard"; exit 1; }
echo "OK: GET /dashboard"
echo "All tests passed."

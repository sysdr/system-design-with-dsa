#!/bin/bash
# Run tests using full path to test script. Run from code_executor_service or by full path.
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_SCRIPT="$PROJECT_DIR/tests/test_worker.py"
if [ ! -f "$TEST_SCRIPT" ]; then
    echo "[ERROR] Test script not found: $TEST_SCRIPT. Run setup.sh first."
    exit 1
fi
exec python3 "$TEST_SCRIPT"

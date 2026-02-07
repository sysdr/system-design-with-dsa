#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
source venv/bin/activate
python3 tests/test_db.py
deactivate
echo "Tests completed."

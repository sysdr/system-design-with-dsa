#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
if [ -f venv/bin/activate ]; then
  source venv/bin/activate
fi
pip install -q requests pytest 2>/dev/null || true
echo "Running API tests (ensure API is running on port 8000)..."
pytest tests/test_api.py -v

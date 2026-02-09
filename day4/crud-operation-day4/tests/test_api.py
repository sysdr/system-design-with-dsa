"""API tests for Problem Manager. Run with: pytest tests/test_api.py -v (API must be running on port 8000)."""
import os
import sys
import pytest

try:
    import requests
except ImportError:
    pytest.skip("requests not installed", allow_module_level=True)

BASE = os.getenv("API_BASE", "http://localhost:8000")

def test_root():
    r = requests.get(f"{BASE}/")
    assert r.status_code == 200
    assert "running" in r.json().get("message", "").lower()

def test_stats():
    r = requests.get(f"{BASE}/stats")
    assert r.status_code == 200
    d = r.json()
    assert "total" in d and "easy" in d and "medium" in d and "hard" in d

def test_problems_list():
    r = requests.get(f"{BASE}/problems/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_problem_get():
    r = requests.get(f"{BASE}/problems/1")
    if r.status_code == 404:
        pytest.skip("No problem with id 1")
    assert r.status_code == 200
    assert "title" in r.json()

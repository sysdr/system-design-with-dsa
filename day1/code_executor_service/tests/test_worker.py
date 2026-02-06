#!/usr/bin/env python3
"""Tests for code executor worker."""
import subprocess
import json
import os
import sys

def get_worker_path():
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "worker.py")

def run_worker(code, input_str="", timeout=5):
    worker = get_worker_path()
    cmd = [sys.executable, worker, "--code", code, "--input", input_str, "--timeout", str(timeout)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
    if result.returncode != 0:
        raise RuntimeError(f"Worker failed: {result.stderr}")
    # Worker prints message before JSON; extract JSON from first { to end
    out = result.stdout
    start = out.find("{")
    if start < 0:
        raise RuntimeError("No JSON in output: " + out[:200])
    return json.loads(out[start:])

def test_hello_world():
    res = run_worker("print('Hello, world!')")
    assert res["status"] == "Accepted", res
    assert "Hello, world!" in res["stdout"], res
    assert res["execution_time_ms"] >= 0, res

def test_with_input():
    res = run_worker("import sys\nprint(sys.stdin.read().strip().upper())", "hello")
    assert res["status"] == "Accepted", res
    assert "HELLO" in res["stdout"], res

def test_runtime_error():
    res = run_worker("print(1 / 0)")
    assert res["status"] == "Runtime Error", res

def test_time_limit_exceeded():
    res = run_worker("while True: pass", timeout=1)
    assert res["status"] == "Time Limit Exceeded", res

if __name__ == "__main__":
    tests = [test_hello_world, test_with_input, test_runtime_error, test_time_limit_exceeded]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"PASS: {t.__name__}")
        except Exception as e:
            print(f"FAIL: {t.__name__}: {e}")
            failed += 1
    sys.exit(1 if failed else 0)

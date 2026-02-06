#!/usr/bin/env python3
"""Display metrics dashboard for code executor."""
import os
import json

def get_metrics_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "metrics.json")

def main():
    path = get_metrics_path()
    if not os.path.isfile(path):
        print("Dashboard: No metrics yet. Run the demo first.")
        print("  total_executions: 0")
        print("  accepted: 0")
        print("  runtime_error: 0")
        print("  time_limit_exceeded: 0")
        print("  execution_failed: 0")
        print("  internal_error: 0")
        return
    with open(path, "r") as f:
        m = json.load(f)
    print("=== Code Executor Dashboard ===")
    print(f"  Total Executions:  {m.get('total_executions', 0)}")
    print(f"  Accepted:          {m.get('accepted', 0)}")
    print(f"  Runtime Error:     {m.get('runtime_error', 0)}")
    print(f"  Time Limit Exceeded: {m.get('time_limit_exceeded', 0)}")
    print(f"  Execution Failed:  {m.get('execution_failed', 0)}")
    print(f"  Internal Error:    {m.get('internal_error', 0)}")
    print(f"  Last Updated:      {m.get('last_updated', 'N/A')}")
    print("===============================")

if __name__ == "__main__":
    main()

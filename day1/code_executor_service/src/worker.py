import subprocess
import tempfile
import os
import time
import json
from datetime import datetime, timezone

def get_metrics_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "metrics.json")

def load_metrics():
    path = get_metrics_path()
    if os.path.isfile(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {
        "total_executions": 0,
        "accepted": 0,
        "runtime_error": 0,
        "time_limit_exceeded": 0,
        "execution_failed": 0,
        "internal_error": 0,
        "last_updated": None
    }

def save_metrics(metrics):
    path = get_metrics_path()
    metrics["last_updated"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(metrics, f, indent=2)
    except IOError:
        pass

def _sanitize_temp_path(text, temp_file_path):
    """Replace temp file path in tracebacks with generic 'submission.py'."""
    if not text or not temp_file_path:
        return text
    return text.replace(temp_file_path, "submission.py")

def update_metrics(result):
    metrics = load_metrics()
    metrics["total_executions"] = metrics.get("total_executions", 0) + 1
    status = result.get("status", "Unknown")
    if status == "Accepted":
        metrics["accepted"] = metrics.get("accepted", 0) + 1
    elif status == "Runtime Error":
        metrics["runtime_error"] = metrics.get("runtime_error", 0) + 1
    elif status == "Time Limit Exceeded":
        metrics["time_limit_exceeded"] = metrics.get("time_limit_exceeded", 0) + 1
    elif status == "Execution Failed":
        metrics["execution_failed"] = metrics.get("execution_failed", 0) + 1
    else:
        metrics["internal_error"] = metrics.get("internal_error", 0) + 1
    save_metrics(metrics)

def execute_python_code(code_string: str, input_string: str = "", timeout_seconds: int = 5):
    """
    Executes a given Python code string with optional input and a timeout.
    Returns a dictionary with execution results.
    """
    result = {
        "status": "Unknown",
        "stdout": "",
        "stderr": "",
        "execution_time_ms": 0,
        "error": None
    }

    with tempfile.TemporaryDirectory() as temp_dir:
        code_file_path = os.path.join(temp_dir, "submission.py")
        input_file_path = os.path.join(temp_dir, "input.txt")

        # Write the user's code to a temporary file
        try:
            with open(code_file_path, "w") as f:
                f.write(code_string)
        except IOError as e:
            result["status"] = "Internal Error"
            result["error"] = f"Failed to write code file: {e}"
            return result

        # Write input to a temporary file if provided
        input_stream = None
        if input_string:
            try:
                with open(input_file_path, "w") as f:
                    f.write(input_string)
                input_stream = open(input_file_path, "r")
            except IOError as e:
                result["status"] = "Internal Error"
                result["error"] = f"Failed to write input file: {e}"
                return result

        start_time = time.perf_counter()
        try:
            # Command to execute the Python script
            cmd = ["python3", code_file_path]

            process = subprocess.run(
                cmd,
                stdin=input_stream,
                capture_output=True,
                text=True,  # Capture stdout/stderr as text
                timeout=timeout_seconds,
                check=False # Don't raise CalledProcessError for non-zero exit codes
            )
            end_time = time.perf_counter()
            result["execution_time_ms"] = int((end_time - start_time) * 1000)
            result["stdout"] = _sanitize_temp_path(process.stdout.strip(), code_file_path)
            result["stderr"] = _sanitize_temp_path(process.stderr.strip(), code_file_path)

            if process.returncode == 0:
                result["status"] = "Accepted"
            else:
                if result["stderr"]:
                    result["status"] = "Runtime Error"
                else:
                    # This case might indicate a logic error or unexpected exit
                    result["status"] = "Execution Failed"
                result["error"] = f"Process exited with code {process.returncode}"

        except subprocess.TimeoutExpired:
            end_time = time.perf_counter()
            result["execution_time_ms"] = int((end_time - start_time) * 1000)
            result["status"] = "Time Limit Exceeded"
            result["error"] = f"Execution timed out after {timeout_seconds} seconds"
            # On timeout, subprocess.run does not return so we leave stdout/stderr as set in result
        except Exception as e:
            result["status"] = "Internal Error"
            result["error"] = f"An unexpected error occurred: {e}"
        finally:
            if input_stream:
                input_stream.close() # Ensure input file handle is closed

    return result

if __name__ == "__main__":
    # This block is for direct execution of worker.py for demonstration/testing
    # In a real system, this function would be called by a message queue consumer or an API handler.
    # For this demo, we use command line arguments if provided, otherwise default examples.

    import argparse

    parser = argparse.ArgumentParser(description="Code Execution Worker Demo")
    parser.add_argument("--code", type=str, help="Python code string to execute.")
    parser.add_argument("--input", type=str, default="", help="Input string for the code.")
    parser.add_argument("--timeout", type=int, default=5, help="Timeout in seconds.")
    args = parser.parse_args()

    if args.code:
        print(f"Executing custom code:\n{args.code}\nWith input:\n{args.input}")
        res = execute_python_code(args.code, args.input, args.timeout)
        update_metrics(res)
        print(json.dumps(res, indent=2))
    else:
        print("Code Execution Worker Demo (Default Examples)")
        print("---------------------------------------------")

        # Example 1: Simple print statement
        code_1 = "print('Hello, world!')"
        print("\n--- Running Example 1 (Simple Print) ---")
        res_1 = execute_python_code(code_1)
        update_metrics(res_1)
        print(json.dumps(res_1, indent=2))

        # Example 2: Code with input
        code_2 = "name = input()\nprint(f'Hello, {name}!')"
        input_2 = "Alice"
        print("\n--- Running Example 2 (With Input) ---")
        res_2 = execute_python_code(code_2, input_string=input_2)
        update_metrics(res_2)
        print(json.dumps(res_2, indent=2))

        # Example 3: Runtime Error
        code_3 = "print(1 / 0)"
        print("\n--- Running Example 3 (Runtime Error) ---")
        res_3 = execute_python_code(code_3)
        update_metrics(res_3)
        print(json.dumps(res_3, indent=2))

        # Example 4: Time Limit Exceeded
        code_4 = "while True:\n    pass"
        print("\n--- Running Example 4 (Time Limit Exceeded) ---")
        res_4 = execute_python_code(code_4, timeout_seconds=2)
        update_metrics(res_4)
        print(json.dumps(res_4, indent=2))


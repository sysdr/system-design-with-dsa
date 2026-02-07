#!/usr/bin/env python3
"""HTTP dashboard server for Day 3 - serves metrics from DB and demo operations."""
import os
import sys
import json
import subprocess
import time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import psycopg2
from psycopg2 import sql
from flask import Flask, jsonify, request
from dashboard import get_metrics

app = Flask(__name__)
PORT = int(os.getenv("DASHBOARD_PORT", "3003"))
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# DB config (same as db_interaction / dashboard)
def _db_config():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": os.getenv("DB_PORT", "5432"),
        "database": os.getenv("DB_NAME", "system_design_db"),
        "user": os.getenv("DB_USER", "admin"),
        "password": os.getenv("DB_PASSWORD", "password"),
    }

def get_conn():
    """Return DB connection or None on failure (does not exit)."""
    try:
        return psycopg2.connect(**_db_config(), connect_timeout=3)
    except Exception:
        return None

# --- Demo operations (update DB so metrics change) ---

def run_full_demo():
    """Run full demo: create schema + insert sample users, problems, submissions."""
    script = os.path.join(PROJECT_DIR, "db_interaction.py")
    if not os.path.isfile(script):
        return {"ok": False, "error": "db_interaction.py not found"}
    try:
        result = subprocess.run(
            [sys.executable, script],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=PROJECT_DIR,
            env={**os.environ},
        )
        if result.returncode != 0:
            return {"ok": False, "error": (result.stderr or result.stdout or "Script failed")[:500]}
        return {"ok": True, "message": "Schema created and sample data inserted."}
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "Demo timed out."}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def add_one_user():
    """Add one sample user so 'users' count increases."""
    conn = get_conn()
    if not conn:
        return {"ok": False, "error": "Database not available. Run 'Run full demo' first (with PostgreSQL running)."}
    try:
        ts = int(time.time())
        username = f"demo_user_{ts}"
        email = f"demo_{ts}@example.com"
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL(
                    "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s);"
                ),
                (username, email, "hashed_demo"),
            )
        conn.commit()
        conn.close()
        return {"ok": True, "message": f"Added user '{username}'."}
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        return {"ok": False, "error": str(e)[:300]}

def add_one_problem():
    """Add one sample problem so 'problems' count increases."""
    conn = get_conn()
    if not conn:
        return {"ok": False, "error": "Database not available. Run 'Run full demo' first (with PostgreSQL running)."}
    try:
        ts = int(time.time())
        title = f"Demo Problem {ts}"
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO problems (title, description, difficulty, tags, test_cases, time_limit_ms, memory_limit_kb) "
                "VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s)",
                (title, "Sample description for demo.", "easy", ["demo"], json.dumps([{"input": "1", "output": "2"}]), 1000, 128000),
            )
        conn.commit()
        conn.close()
        return {"ok": True, "message": f"Added problem '{title}'."}
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        return {"ok": False, "error": str(e)[:300]}

def add_one_submission():
    """Add one submission (links existing user and problem) so 'submissions' count increases."""
    conn = get_conn()
    if not conn:
        return {"ok": False, "error": "Database not available. Run 'Run full demo' first (with PostgreSQL running)."}
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users ORDER BY created_at LIMIT 1;")
            row = cur.fetchone()
            if not row:
                conn.close()
                return {"ok": False, "error": "No users. Run 'Run full demo' first."}
            user_id = row[0]
            cur.execute("SELECT id FROM problems ORDER BY created_at LIMIT 1;")
            row = cur.fetchone()
            if not row:
                conn.close()
                return {"ok": False, "error": "No problems. Run 'Run full demo' first."}
            problem_id = row[0]
            cur.execute(
                sql.SQL(
                    "INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (%s, %s, %s, %s, %s);"
                ),
                (user_id, problem_id, "python", "# demo submission", "pending"),
            )
        conn.commit()
        conn.close()
        return {"ok": True, "message": "Added one submission (pending)."}
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        return {"ok": False, "error": str(e)[:300]}

# --- API routes ---

@app.route("/api/metrics")
def api_metrics():
    m = get_metrics()
    if m.get("error"):
        return jsonify({"error": m["error"], "users": 0, "problems": 0, "submissions": 0, "accepted": 0, "pending": 0}), 200
    return jsonify(m)

@app.route("/api/demo/full", methods=["POST"])
def api_demo_full():
    out = run_full_demo()
    m = get_metrics()
    return jsonify({**out, "metrics": m})

@app.route("/api/demo/add-user", methods=["POST"])
def api_demo_add_user():
    out = add_one_user()
    m = get_metrics()
    return jsonify({**out, "metrics": m})

@app.route("/api/demo/add-problem", methods=["POST"])
def api_demo_add_problem():
    out = add_one_problem()
    m = get_metrics()
    return jsonify({**out, "metrics": m})

@app.route("/api/demo/add-submission", methods=["POST"])
def api_demo_add_submission():
    out = add_one_submission()
    m = get_metrics()
    return jsonify({**out, "metrics": m})

# --- Dashboard HTML: metrics + demo operations only ---

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Day 3 — Schema Design Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #fafbfc;
      --surface: #ffffff;
      --border: #e1e4e8;
      --text: #24292f;
      --text-muted: #57606a;
      --accent: #0969da;
      --accent-hover: #0550ae;
      --success-bg: #dafbe1;
      --success-text: #1a7f37;
      --error-bg: #ffebe9;
      --error-text: #cf222e;
      --radius: 12px;
      --shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2rem 1rem 3rem;
      line-height: 1.5;
      min-height: 100vh;
    }
    .container { max-width: 720px; margin: 0 auto; }
    header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.25rem 0;
      letter-spacing: -0.02em;
    }
    header .tagline { font-size: 0.9375rem; color: var(--text-muted); margin: 0; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 1rem 0;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }
    .metric-item {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .metric-item .label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      display: block;
      margin-bottom: 0.25rem;
    }
    .metric-item .value { font-size: 1.5rem; font-weight: 600; color: var(--text); }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--success-text);
      margin-bottom: 1rem;
    }
    .live-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--success-text);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .ops-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
    .btn {
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.625rem 1.125rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .btn:hover:not(:disabled) { background: var(--bg); border-color: #adbac9; }
    .btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .btn.primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .msg { margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; display: none; }
    .msg.show { display: block; }
    .msg.ok { background: var(--success-bg); color: var(--success-text); border: 1px solid #7ee787; }
    .msg.err { background: var(--error-bg); color: var(--error-text); border: 1px solid #ffa198; }
    .intro-text { font-size: 0.9375rem; color: var(--text-muted); margin: 0 0 1rem 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Day 3 — Schema Design</h1>
      <p class="tagline">Coding-judge schema: users, problems, and submissions. Run demo operations to update metrics.</p>
    </header>
    <main>
      <section class="card" aria-labelledby="metrics-heading">
        <h2 class="card-title" id="metrics-heading">Live metrics</h2>
        <span class="live-badge" aria-hidden="true">Live</span>
        <div class="metrics-grid" id="metrics" role="status" aria-live="polite"></div>
      </section>
      <section class="card" aria-labelledby="ops-heading">
        <h2 class="card-title" id="ops-heading">Demo operations</h2>
        <p class="intro-text">Run these to change the database; metrics above will refresh automatically.</p>
        <div class="ops-row">
          <button type="button" class="btn primary" id="op-full" onclick="runDemo('full')">Run full demo</button>
          <button type="button" class="btn" id="op-user" onclick="runDemo('add-user')">Add user</button>
          <button type="button" class="btn" id="op-problem" onclick="runDemo('add-problem')">Add problem</button>
          <button type="button" class="btn" id="op-submission" onclick="runDemo('add-submission')">Add submission</button>
        </div>
        <div id="msg" class="msg" role="alert"></div>
      </section>
    </main>
  </div>
  <script>
    function renderMetrics(m) {
      var keys = ['users', 'problems', 'submissions', 'accepted', 'pending'];
      var labels = { users: 'Users', problems: 'Problems', submissions: 'Submissions', accepted: 'Accepted', pending: 'Pending' };
      var html = keys.map(function(k) {
        var v = m[k] != null ? m[k] : '—';
        return '<div class="metric-item"><span class="label">' + (labels[k] || k) + '</span><span class="value">' + v + '</span></div>';
      }).join('');
      document.getElementById('metrics').innerHTML = html;
    }
    function fetchMetrics() { fetch('/api/metrics').then(function(r) { return r.json(); }).then(renderMetrics); }
    function showMsg(text, isErr) {
      var el = document.getElementById('msg');
      el.textContent = text;
      el.className = 'msg ' + (isErr ? 'err' : 'ok') + (text ? ' show' : '');
      el.style.display = text ? 'block' : 'none';
    }
    function setButtons(disabled) {
      ['op-full', 'op-user', 'op-problem', 'op-submission'].forEach(function(id) { document.getElementById(id).disabled = disabled; });
    }
    function runDemo(op) {
      setButtons(true);
      showMsg('Running…', false);
      var path = '/api/demo/' + (op === 'full' ? 'full' : op);
      fetch(path, { method: 'POST' }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.metrics) renderMetrics(data.metrics);
        if (data.ok) showMsg(data.message || 'Done.', false); else showMsg(data.error || 'Failed.', true);
      }).catch(function(e) { showMsg('Request failed: ' + e.message, true); }).finally(function() { setButtons(false); });
    }
    fetchMetrics();
    setInterval(fetchMetrics, 3000);
  </script>
</body>
</html>"""

@app.route("/")
def index():
    resp = app.make_response(DASHBOARD_HTML)
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)

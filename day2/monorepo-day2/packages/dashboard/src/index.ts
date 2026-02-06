import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3002;
const MONOREPO_ROOT = path.resolve(__dirname, "../../..");
const METRICS_FILE = path.join(MONOREPO_ROOT, "metrics.json");

interface Metrics {
  demo_runs: number;
  frontend_runs: number;
  backend_runs: number;
  last_demo_at: string | null;
  last_frontend_at: string | null;
  last_backend_at: string | null;
}

function readMetrics(): Metrics {
  try {
    const data = fs.readFileSync(METRICS_FILE, "utf-8");
    return { ...defaultMetrics(), ...JSON.parse(data) };
  } catch {
    return defaultMetrics();
  }
}

function defaultMetrics(): Metrics {
  return {
    demo_runs: 0,
    frontend_runs: 0,
    backend_runs: 0,
    last_demo_at: null,
    last_frontend_at: null,
    last_backend_at: null,
  };
}

function writeMetrics(m: Metrics): void {
  fs.mkdirSync(path.dirname(METRICS_FILE), { recursive: true });
  fs.writeFileSync(METRICS_FILE, JSON.stringify(m, null, 2), "utf-8");
}

function recordEvent(type: "demo_run" | "frontend_run" | "backend_run"): Metrics {
  const m = readMetrics();
  const now = new Date().toISOString();
  if (type === "demo_run") {
    m.demo_runs += 1;
    m.frontend_runs += 1;
    m.backend_runs += 1;
    m.last_demo_at = now;
    m.last_frontend_at = now;
    m.last_backend_at = now;
  } else if (type === "frontend_run") {
    m.frontend_runs += 1;
    m.last_frontend_at = now;
  } else if (type === "backend_run") {
    m.backend_runs += 1;
    m.last_backend_at = now;
  }
  writeMetrics(m);
  return m;
}

app.use(cors());
app.use(express.json());
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Avoid 404 for browser favicon request
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.get("/api/metrics", (_req, res) => {
  try {
    res.json(readMetrics());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/metrics/event", (req, res) => {
  const type = req.body?.type;
  if (type !== "demo_run" && type !== "frontend_run" && type !== "backend_run") {
    return res.status(400).json({ error: "Invalid event type" });
  }
  const m = recordEvent(type);
  res.json(m);
});

const DEMO_WAIT_MS = 7500;
const MAX_DEMO_LOGS = 500;

interface DemoLogEntry {
  ts: string;
  source: "frontend" | "backend";
  line: string;
}

let lastDemoLogs: DemoLogEntry[] = [];

function pushDemoLogs(logs: DemoLogEntry[], source: "frontend" | "backend", data: Buffer | string) {
  const text = (typeof data === "string" ? data : data.toString()).replace(/\r\n/g, "\n");
  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed) logs.push({ ts: new Date().toISOString(), source, line: trimmed });
  });
}

app.post("/api/run-demo", (req, res) => {
  const demoLogs: DemoLogEntry[] = [];
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    try {
      frontend.kill("SIGTERM");
    } catch (_) {}
    try {
      backend.kill("SIGTERM");
    } catch (_) {}
    lastDemoLogs = demoLogs.slice(-MAX_DEMO_LOGS);
    const m = recordEvent("demo_run");
    res.json({ ok: true, metrics: m, logs: lastDemoLogs });
  }

  // Spawn node directly so we capture stdout/stderr (pnpm may not forward it)
  const frontend = spawn("node", ["packages/frontend/dist/index.js"], {
    cwd: MONOREPO_ROOT,
    stdio: "pipe",
    shell: false,
  });
  const backend = spawn("node", ["packages/backend/dist/index.js"], {
    cwd: MONOREPO_ROOT,
    stdio: "pipe",
    shell: false,
  });
  frontend.stdout?.on("data", (d) => pushDemoLogs(demoLogs, "frontend", d));
  frontend.stderr?.on("data", (d) => pushDemoLogs(demoLogs, "frontend", d));
  backend.stdout?.on("data", (d) => pushDemoLogs(demoLogs, "backend", d));
  backend.stderr?.on("data", (d) => pushDemoLogs(demoLogs, "backend", d));

  const timeout = setTimeout(finish, DEMO_WAIT_MS);

  // Wait for streams to close so all data is received before finishing
  Promise.all([
    new Promise<void>((r) => frontend.on("close", () => r())),
    new Promise<void>((r) => backend.on("close", () => r())),
  ]).then(() => {
    clearTimeout(timeout);
    // Brief delay to allow any final "data" events to be processed
    setTimeout(finish, 150);
  }).catch(() => {
    clearTimeout(timeout);
    finish();
  });
});

app.get("/api/demo-logs", (_req, res) => {
  res.json({ logs: lastDemoLogs });
});

app.get("/api/metrics/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const interval = setInterval(() => {
    try {
      res.write("data: " + JSON.stringify(readMetrics()) + "\n\n");
    } catch {
      clearInterval(interval);
    }
  }, 1500);
  req.on("close", () => clearInterval(interval));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Dashboard server at http://localhost:${PORT}`);
});

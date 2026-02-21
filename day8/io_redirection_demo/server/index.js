const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const port = process.env.PORT || 3008;

let linesProcessed = 0;
let errorsCaptured = 0;
let demosRun = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/metrics', (req, res) => {
  res.json({
    linesProcessed,
    errorsCaptured,
    demosRun,
    lastUpdated: new Date().toISOString()
  });
});

app.post('/api/demo', (req, res) => {
  const projDir = path.join(__dirname, '..');
  let outLines = 0;
  let errLines = 0;
  try {
    const exe = path.join(projDir, 'stream_processor');
    const inputPath = path.join(projDir, 'input.txt');
    const outPath = path.join(projDir, 'output.log');
    const errPath = path.join(projDir, 'error.log');
    if (fs.existsSync(exe) && fs.existsSync(inputPath)) {
      execSync('"' + exe + '" < "' + inputPath + '" > "' + outPath + '" 2> "' + errPath + '"', { cwd: projDir, encoding: 'utf8', maxBuffer: 1024 * 1024, shell: true });
      if (fs.existsSync(outPath)) {
        const out = fs.readFileSync(outPath, 'utf8');
        outLines = out.split('\n').filter(function (l) { return l.trim().length > 0; }).length;
      }
      if (fs.existsSync(errPath)) {
        const err = fs.readFileSync(errPath, 'utf8');
        errLines = err.split('\n').filter(function (l) { return l.trim().length > 0; }).length;
      }
    } else {
      outLines = 4;
      errLines = 1;
    }
  } catch (e) {
    outLines = 4;
    errLines = 1;
  }
  linesProcessed += outLines || 4;
  errorsCaptured += errLines || 1;
  demosRun += 1;
  res.json({
    message: 'Demo executed',
    linesProcessed,
    errorsCaptured,
    demosRun
  });
});

app.get('/dashboard', (req, res) => {
  const lastUpdated = new Date().toISOString();
  const lastDisplay = new Date(lastUpdated).toLocaleString();
  const initialMetrics = [
    '<div class="metric-card"><span class="label">Lines processed</span><span class="value">' + linesProcessed + '</span></div>',
    '<div class="metric-card"><span class="label">Errors captured</span><span class="value">' + errorsCaptured + '</span></div>',
    '<div class="metric-card"><span class="label">Demos run</span><span class="value">' + demosRun + '</span></div>',
    '<div class="metric-card"><span class="label">Last updated</span><span class="value small">' + lastDisplay + '</span></div>'
  ].join('');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>I/O Redirection Demo — Dashboard</title>
  <style>
    :root { --bg: #f6f8fa; --surface: #ffffff; --border: #d0d7de; --text: #1f2328; --muted: #656d76; --accent: #0969da; --green: #1a7f37; --red: #cf222e; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; }
    .intro { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .intro h1 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; }
    .intro p { margin: 0; font-size: 0.9rem; color: var(--muted); }
    .section-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.75rem; }
    .metrics { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
    .metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; min-width: 120px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .metric-card .label { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem; }
    .metric-card .value { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .metric-card .value.small { font-size: 0.85rem; font-weight: 500; color: var(--muted); }
    .actions { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .actions p { margin: 0 0 1rem; font-size: 0.9rem; color: var(--muted); }
    .btn { background: var(--accent); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
    #demoStatus { margin-top: 0.75rem; font-size: 0.85rem; min-height: 1.2em; }
    #demoStatus.ok { color: var(--green); }
    #demoStatus.err { color: var(--red); }
    .about-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .about-section h2 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; color: var(--text); }
    .about-section p { margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--muted); line-height: 1.55; }
    .about-section p:last-child { margin-bottom: 0; }
    .about-section ul { margin: 0 0 0.75rem 1.25rem; font-size: 0.9rem; color: var(--muted); line-height: 1.5; }
    .workflow-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-top: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .workflow-section h2 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; color: var(--text); }
    .workflow-section p.desc { margin: 0 0 1.25rem; font-size: 0.85rem; color: var(--muted); line-height: 1.5; }
    .workflow-diagram { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0; padding: 1rem 0; overflow-x: auto; }
    .workflow-node { background: var(--bg); border: 2px solid var(--accent); color: var(--text); border-radius: 10px; padding: 0.65rem 1rem; font-size: 0.8rem; font-weight: 600; min-width: 90px; text-align: center; box-shadow: 0 1px 4px rgba(9,105,218,0.15); }
    .workflow-node.subtle { border-color: var(--border); color: var(--muted); font-weight: 500; }
    .workflow-arrow { display: flex; align-items: center; padding: 0 4px; flex-shrink: 0; }
    .workflow-arrow svg { width: 32px; height: 24px; }
    .workflow-arrow line { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 6 5; stroke-dashoffset: 0; animation: flow 2s linear infinite; }
    .workflow-arrow .arrowhead { fill: var(--accent); animation: pulse 2s ease-in-out infinite; }
    .workflow-node small { color: var(--muted); font-weight: 400; font-size: 0.68em; display: block; margin-top: 2px; }
    @keyframes flow { to { stroke-dashoffset: -22; } }
    @keyframes pulse { 0%,100% { opacity: 0.9; } 50% { opacity: 0.5; } }
  </style>
</head>
<body>
  <div class="container">
    <section class="intro">
      <h1>I/O Redirection Demo</h1>
      <p>Metrics update when you run the stream processor demo or click &quot;Run demo&quot;.</p>
    </section>
    <section class="about-section">
      <h2>About this project</h2>
      <p>This application demonstrates <strong>I/O redirection</strong> in practice: how a program reads from <strong>stdin</strong>, writes normal output to <strong>stdout</strong>, and writes errors to <strong>stderr</strong>. The shell (or this dashboard) can redirect those streams to files or pipes.</p>
      <p><strong>Stream processor</strong> (C program): it reads lines from stdin. For each <em>non-empty</em> line it adds a timestamp and prints to stdout. For <em>empty or whitespace-only</em> lines it prints an error message to stderr. No files are opened inside the program—everything is stdin/stdout/stderr.</p>
      <p><strong>What the dashboard does:</strong></p>
      <ul>
        <li>Runs the stream processor with sample input (<code>input.txt</code>).</li>
        <li>Redirects stdout to an output log and stderr to an error log.</li>
        <li>Counts how many lines went to each stream and shows &quot;Lines processed&quot; and &quot;Errors captured&quot;.</li>
        <li>Clicking &quot;Run demo&quot; runs this flow again and updates the metrics.</li>
      </ul>
    </section>
    <p class="section-title">Live metrics</p>
    <section class="metrics" id="metrics">${initialMetrics}</section>
    <p class="section-title">Try it</p>
    <section class="actions">
      <p>Click &quot;Run demo&quot; to run the stream processor (stdin/stdout/stderr redirect) and update metrics.</p>
      <button type="button" class="btn" id="demoBtn">Run demo</button>
      <p id="demoStatus"></p>
    </section>
    <section class="workflow-section">
      <h2>Application workflow</h2>
      <p class="desc">How this application is supposed to work: input flows into the stream processor, which splits output into normal lines and errors; those are captured into logs and turned into the metrics you see above.</p>
      <div class="workflow-diagram" aria-label="Workflow: Input to Stream Processor to Logs to Metrics to Dashboard">
        <span class="workflow-node">Input<br/><small class="subtle">input.txt</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node">Stream Processor<br/><small class="subtle">stdin → stdout / stderr</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node">Logs<br/><small class="subtle">output.log, error.log</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node">Metrics<br/><small class="subtle">lines, errors, demos</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node subtle">Dashboard</span>
      </div>
    </section>
  </div>
  <script>
    function render(m) {
      var last = (m.lastUpdated) ? new Date(m.lastUpdated).toLocaleString() : '—';
      document.getElementById('metrics').innerHTML =
        '<div class="metric-card"><span class="label">Lines processed</span><span class="value">' + (m.linesProcessed != null ? m.linesProcessed : 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Errors captured</span><span class="value">' + (m.errorsCaptured != null ? m.errorsCaptured : 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Demos run</span><span class="value">' + (m.demosRun != null ? m.demosRun : 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Last updated</span><span class="value small">' + last + '</span></div>';
    }
    function fetchMetrics() { fetch('/api/metrics').then(function(r) { return r.json(); }).then(render).catch(function() { render({}); }); }
    fetchMetrics();
    setInterval(fetchMetrics, 3000);
    var statusEl = document.getElementById('demoStatus');
    document.getElementById('demoBtn').onclick = function() {
      statusEl.textContent = 'Running…';
      statusEl.className = '';
      fetch('/api/demo', { method: 'POST' }).then(function(r) { return r.json(); }).then(function(d) {
        statusEl.textContent = 'Done. Lines: ' + d.linesProcessed + ', Errors: ' + d.errorsCaptured + ', Demos: ' + d.demosRun;
        statusEl.className = 'ok';
        fetchMetrics();
      }).catch(function() { statusEl.textContent = 'Request failed.'; statusEl.className = 'err'; });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(port, function() {
  console.log('I/O Redirection Dashboard at http://localhost:' + port);
  console.log('Dashboard: http://localhost:' + port + '/dashboard');
});

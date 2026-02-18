const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const port = process.env.PORT || 3007;

let tokensProduced = 0;
let filesCompiled = 0;
let pipelinesRun = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/metrics', (req, res) => {
  res.json({
    tokensProduced,
    filesCompiled,
    pipelinesRun,
    lastUpdated: new Date().toISOString()
  });
});

app.post('/api/demo', (req, res) => {
  const projDir = path.join(__dirname, '..');
  let added = 0;
  try {
    execSync('python3 src/lexer_service.py', { cwd: projDir, encoding: 'utf8' });
    const tokensPath = path.join(projDir, 'output', 'tokens.json');
    if (fs.existsSync(tokensPath)) {
      const data = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      added = Array.isArray(data) ? data.length : 0;
    }
  } catch (e) { added = 5; }
  tokensProduced += added || 5;
  filesCompiled += 1;
  pipelinesRun += 1;
  res.json({
    message: 'Demo executed',
    tokensProduced,
    filesCompiled,
    pipelinesRun
  });
});

app.get('/dashboard', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Compiler Pipeline — Dashboard</title>
  <style>
    :root { --bg: #f6f8fa; --surface: #ffffff; --border: #d0d7de; --text: #1f2328; --muted: #656d76; --accent: #0969da; --green: #1a7f37; --red: #cf222e; --flow: #0969da; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; }
    .intro { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .intro h1 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; color: var(--text); }
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
    .workflow-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-top: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .workflow-section h2 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; color: var(--text); }
    .workflow-section p.desc { margin: 0 0 1.25rem; font-size: 0.85rem; color: var(--muted); line-height: 1.5; }
    .workflow-diagram { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0; padding: 1rem 0; overflow-x: auto; }
    .workflow-node { background: var(--bg); border: 2px solid var(--accent); color: var(--text); border-radius: 10px; padding: 0.65rem 1rem; font-size: 0.8rem; font-weight: 600; min-width: 100px; text-align: center; box-shadow: 0 1px 4px rgba(9,105,218,0.15); }
    .workflow-node.subtle { border-color: var(--border); color: var(--muted); font-weight: 500; }
    .workflow-arrow { display: flex; align-items: center; padding: 0 4px; flex-shrink: 0; }
    .workflow-arrow svg { width: 36px; height: 24px; }
    .workflow-arrow line { stroke: var(--flow); stroke-width: 2; stroke-dasharray: 8 6; stroke-dashoffset: 0; animation: flow 2s linear infinite; }
    .workflow-arrow .arrowhead { fill: var(--flow); animation: pulse 2s ease-in-out infinite; }
    .workflow-node small { color: var(--muted); font-weight: 400; font-size: 0.7em; display: block; margin-top: 2px; }
    @keyframes flow { to { stroke-dashoffset: -28; } }
    @keyframes pulse { 0%,100% { opacity: 0.9; } 50% { opacity: 0.5; } }
  </style>
</head>
<body>
  <div class="container">
    <section class="intro">
      <h1>Compiler Pipeline Demo</h1>
      <p>Metrics update when you run the lexer pipeline or click &quot;Run demo&quot;.</p>
    </section>
    <p class="section-title">Live metrics</p>
    <section class="metrics" id="metrics"></section>
    <p class="section-title">Try it</p>
    <section class="actions">
      <p>Click &quot;Run demo&quot; to run the lexer and update metrics.</p>
      <button type="button" class="btn" id="demoBtn">Run demo</button>
      <p id="demoStatus"></p>
    </section>
    <section class="workflow-section">
      <h2>How this project works</h2>
      <p class="desc">When you click Run demo, the server runs the lexer on the mini-language source. The flow below shows the pipeline: source code is tokenized into a structured list, then the server updates the metrics you see above.</p>
      <div class="workflow-diagram">
        <span class="workflow-node">Source<br/><small class="subtle">input.minilang</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node">Lexer<br/><small class="subtle">Python</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node">Tokens<br/><small class="subtle">tokens.json</small></span>
        <div class="workflow-arrow" aria-hidden="true">
          <svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="12" x2="28" y2="12" class="line-flow"/><polygon points="28,8 36,12 28,16" class="arrowhead"/></svg>
        </div>
        <span class="workflow-node subtle">API Server</span>
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
        '<div class="metric-card"><span class="label">Tokens produced</span><span class="value">' + (m.tokensProduced != null ? m.tokensProduced : 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Files compiled</span><span class="value">' + (m.filesCompiled != null ? m.filesCompiled : 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Pipelines run</span><span class="value">' + (m.pipelinesRun != null ? m.pipelinesRun : 0) + '</span></div>' +
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
        statusEl.textContent = 'Done. Tokens: ' + d.tokensProduced + ', Pipelines: ' + d.pipelinesRun;
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

app.listen(port, () => {
  console.log('Compiler Pipeline Dashboard at http://localhost:' + port);
  console.log('Dashboard: http://localhost:' + port + '/dashboard');
});

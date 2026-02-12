const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// In-memory metrics for dashboard (submissions and files uploaded)
let submissionsCount = 0;
let filesUploadedCount = 0;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage configuration: diskStorage saves files to disk
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // files will be saved in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer upload middleware instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 2 // Max 2 files per request
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['text/plain', 'application/javascript', 'application/json', 'image/jpeg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only text, JS, JSON, JPEG, PNG allowed.'), false);
        }
    }
});

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics endpoint for dashboard
app.get('/api/metrics', (req, res) => {
    res.json({
        submissions: submissionsCount,
        filesUploaded: filesUploadedCount,
        lastUpdated: new Date().toISOString()
    });
});

// Demo endpoint - simulates a submission so dashboard metrics update (non-zero)
app.post('/api/demo', (req, res) => {
    submissionsCount += 1;
    filesUploadedCount += 2;
    res.json({ message: 'Demo executed', submissions: submissionsCount, filesUploaded: filesUploadedCount });
});

// Dashboard HTML: metrics + demo button
app.get('/dashboard', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Upload Service — Dashboard</title>
  <style>
    :root { --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --accent: #58a6ff; --green: #3fb950; --red: #f85149; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; line-height: 1.5; }
    .container { max-width: 720px; margin: 0 auto; }
    .intro { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-bottom: 1.5rem; }
    .intro h1 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; }
    .intro p { margin: 0; font-size: 0.9rem; color: var(--muted); }
    .intro a { color: var(--accent); text-decoration: none; }
    .section-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.75rem; }
    .metrics { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
    .metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; min-width: 120px; }
    .metric-card .label { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem; }
    .metric-card .value { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .metric-card .value.small { font-size: 0.85rem; font-weight: 500; color: var(--muted); }
    .actions { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.75rem; }
    .actions p { margin: 0 0 1rem; font-size: 0.9rem; color: var(--muted); }
    .btn { background: var(--accent); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
    #demoStatus { margin-top: 0.75rem; font-size: 0.85rem; min-height: 1.2em; }
    #demoStatus.ok { color: var(--green); }
    #demoStatus.err { color: var(--red); }
  </style>
</head>
<body>
  <div class="container">
    <section class="intro">
      <h1>About this application</h1>
      <p>This is the <strong>File Upload Service</strong> for Day 6. Submit raw code and upload files (code file, test cases). Metrics below update when you submit from the form at <a href="/index.html">/index.html</a> or when you click &quot;Run demo&quot;.</p>
    </section>
    <p class="section-title">Live metrics</p>
    <section class="metrics" id="metrics"></section>
    <p class="section-title">Try it</p>
    <section class="actions">
      <p>Click &quot;Run demo&quot; to simulate a submission. The metrics above will update.</p>
      <button type="button" class="btn" id="demoBtn">Run demo</button>
      <p id="demoStatus"></p>
    </section>
  </div>
  <script>
    function render(m) {
      var last = (m.lastUpdated) ? new Date(m.lastUpdated).toLocaleString() : '—';
      document.getElementById('metrics').innerHTML =
        '<div class="metric-card"><span class="label">Submissions</span><span class="value">' + (m.submissions || 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Files uploaded</span><span class="value">' + (m.filesUploaded || 0) + '</span></div>' +
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
        statusEl.textContent = 'Done. Submissions: ' + d.submissions + ', Files uploaded: ' + d.filesUploaded;
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

// Route to handle file uploads and raw code submission
app.post('/submit', upload.fields([
    { name: 'codeFile', maxCount: 1 },
    { name: 'testCases', maxCount: 1 }
]), (req, res) => {
    try {
        submissionsCount += 1;
        if (req.files && Object.keys(req.files).length > 0) {
            const fileCount = Object.keys(req.files).reduce((sum, key) => sum + req.files[key].length, 0);
            filesUploadedCount += fileCount;
        }
        console.log('--- Submission Received ---');
        console.log('Form Fields:', req.body);

        if (req.files && Object.keys(req.files).length > 0) {
            console.log('Uploaded Files:');
            for (const fieldName in req.files) {
                req.files[fieldName].forEach(file => {
                    console.log(`  - Field: ${file.fieldname}, Original Name: ${file.originalname}, Saved Path: ${file.path}, Size: ${file.size} bytes`);
                });
            }
        } else {
            console.log('No files uploaded.');
        }

        const submissionId = `sub-${Date.now()}`;
        console.log(`[${submissionId}] Code submission and files received. Queuing for processing...`);

        res.status(200).json({
            message: 'Submission received and queued for processing.',
            submissionId: submissionId,
            rawCodeLength: req.body.rawCode ? req.body.rawCode.length : 0,
            files: req.files ? Object.keys(req.files).map(key => req.files[key].map(f => f.filename)).flat() : []
        });

    } catch (error) {
        console.error('Error during submission:', error);
        res.status(500).json({ message: 'Error processing submission.', error: error.message });
    }
});

// Global error handler for Multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
        console.error('Generic error:', err.message);
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    next();
});

app.listen(port, () => {
    console.log(`Upload Service listening at http://localhost:${port}`);
    console.log(`Client available at http://localhost:${port}/index.html`);
});

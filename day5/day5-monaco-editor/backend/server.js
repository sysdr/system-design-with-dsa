const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory metrics for dashboard (drafts saved count)
let draftsSavedCount = 0;

// In-memory problem data (for simplicity, replace with DB in real app)
const problems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
    defaultCode: "function twoSum(nums, target) {\n  // Write your code here\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}",
    language: "javascript"
  },
  {
    id: 2,
    title: "Reverse String",
    difficulty: "Easy",
    description: "Write a function that reverses a string. The input string is given as an array of characters char[].\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    defaultCode: "function reverseString(s) {\n  // Write your code here\n  let left = 0;\n  let right = s.length - 1;\n  while (left < right) {\n    const temp = s[left];\n    s[left] = s[right];\n    s[right] = temp;\n    left++;\n    right--;\n  }\n}",
    language: "javascript"
  },
  {
    id: 3,
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nValid if: open brackets are closed by the same type, and in the correct order.",
    defaultCode: "function isValid(s) {\n  // Write your code here\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const c of s) {\n    if (c in map) {\n      if (stack.pop() !== map[c]) return false;\n    } else {\n      stack.push(c);\n    }\n  }\n  return stack.length === 0;\n}",
    language: "javascript"
  },
  {
    id: 4,
    title: "Maximum Subarray",
    difficulty: "Medium",
    description: "Given an integer array nums, find the subarray with the largest sum and return its sum.\n\nExample:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: [4,-1,2,1] has the largest sum 6.",
    defaultCode: "function maxSubArray(nums) {\n  // Write your code here (Kadane's algorithm)\n  let maxSum = nums[0];\n  let current = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    current = Math.max(nums[i], current + nums[i]);\n    maxSum = Math.max(maxSum, current);\n  }\n  return maxSum;\n}",
    language: "javascript"
  },
  {
    id: 5,
    title: "FizzBuzz",
    difficulty: "Easy",
    description: "Given an integer n, return a string array where:\n- answer[i] == \"FizzBuzz\" if i is divisible by 3 and 5\n- answer[i] == \"Fizz\" if i is divisible by 3\n- answer[i] == \"Buzz\" if i is divisible by 5\n- answer[i] == i (as string) otherwise",
    defaultCode: "function fizzBuzz(n) {\n  // Write your code here\n  const result = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) result.push('FizzBuzz');\n    else if (i % 3 === 0) result.push('Fizz');\n    else if (i % 5 === 0) result.push('Buzz');\n    else result.push(String(i));\n  }\n  return result;\n}",
    language: "javascript"
  }
];

// Endpoint to list all problems (for dashboard and problem picker)
app.get('/api/problems', (req, res) => {
  res.json(problems.map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty })));
});

// Endpoint to get a specific problem
app.get('/api/problems/:id', (req, res) => {
  const problemId = parseInt(req.params.id);
  const problem = problems.find(p => p.id === problemId);
  if (problem) {
    // In a real system, you'd also fetch user's saved draft here
    res.json(problem);
  } else {
    res.status(404).send({ message: 'Problem not found' });
  }
});

// Endpoint to save a code draft
app.put('/api/problems/:id/draft', (req, res) => {
  const problemId = parseInt(req.params.id);
  const { code, language } = req.body;
  if (!code || !language) {
    return res.status(400).send({ message: 'Code and language are required.' });
  }
  draftsSavedCount += 1;
  console.log(`[BACKEND] Received draft for problem ${problemId} (Lang: ${language}): ${code.substring(0, 100)}...`);
  // In a real system, save this to a database associated with the user and problem
  res.status(200).send({ message: 'Draft saved successfully', problemId, language });
});

// Metrics endpoint for dashboard
app.get('/api/metrics', (req, res) => {
  res.json({
    problems: problems.length,
    draftsSaved: draftsSavedCount,
    lastUpdated: new Date().toISOString()
  });
});

// Demo endpoint - simulates a draft save so dashboard metrics update (non-zero)
app.post('/api/demo', (req, res) => {
  draftsSavedCount += 1;
  res.json({ message: 'Demo executed', draftsSaved: draftsSavedCount });
});

// Dashboard HTML: intro first, then metrics, then demo (professional layout)
app.get('/dashboard', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Code Practice — Dashboard</title>
  <style>
    :root { --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --accent: #58a6ff; --green: #3fb950; --red: #f85149; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; line-height: 1.5; }
    .container { max-width: 720px; margin: 0 auto; }
    .intro { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.75rem; margin-bottom: 1.5rem; }
    .intro h1 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; color: var(--text); }
    .intro p { margin: 0; font-size: 0.9rem; color: var(--muted); }
    .intro a { color: var(--accent); text-decoration: none; }
    .intro a:hover { text-decoration: underline; }
    .section-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.75rem; }
    .metrics { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
    .metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; min-width: 120px; }
    .metric-card .label { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem; }
    .metric-card .value { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .metric-card .value.small { font-size: 0.85rem; font-weight: 500; color: var(--muted); }
    .actions { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.75rem; }
    .actions p { margin: 0 0 1rem; font-size: 0.9rem; color: var(--muted); }
    .btn { display: inline-block; background: var(--accent); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
    .btn:hover { opacity: 0.9; }
    #demoStatus { margin-top: 0.75rem; font-size: 0.85rem; min-height: 1.2em; }
    #demoStatus.ok { color: var(--green); }
    #demoStatus.err { color: var(--red); }
  </style>
</head>
<body>
  <div class="container">
    <section class="intro" aria-labelledby="about-heading">
      <h1 id="about-heading">About this application</h1>
      <p>This is a <strong>code practice app</strong> for solving algorithm problems in the browser. You get <strong>5 problems</strong> (Two Sum, Reverse String, Valid Parentheses, Maximum Subarray, FizzBuzz). Write your solution in the Monaco editor; your draft is <strong>auto-saved</strong> as you type. Use the editor at <a href="http://localhost:3000">localhost:3000</a> to pick a problem and start coding.</p>
    </section>
    <p class="section-title">Live metrics</p>
    <section class="metrics" id="metrics" aria-live="polite"></section>
    <p class="section-title">Try it</p>
    <section class="actions">
      <p>Click &quot;Run demo&quot; to simulate a draft save. The &quot;Drafts saved&quot; count above will update.</p>
      <button type="button" class="btn" id="demoBtn">Run demo</button>
      <p id="demoStatus"></p>
    </section>
  </div>
  <script>
    function render(m) {
      var last = (m.lastUpdated) ? new Date(m.lastUpdated).toLocaleString() : '—';
      document.getElementById('metrics').innerHTML =
        '<div class="metric-card"><span class="label">Problems available</span><span class="value">' + (m.problems || 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Drafts saved</span><span class="value">' + (m.draftsSaved || 0) + '</span></div>' +
        '<div class="metric-card"><span class="label">Last updated</span><span class="value small">' + last + '</span></div>';
    }
    function fetchMetrics() {
      fetch('/api/metrics').then(function(r) { return r.json(); }).then(render).catch(function() { render({ problems: 0, draftsSaved: 0 }); });
    }
    fetchMetrics();
    setInterval(fetchMetrics, 3000);
    var statusEl = document.getElementById('demoStatus');
    document.getElementById('demoBtn').onclick = function() {
      statusEl.textContent = 'Running…';
      statusEl.className = '';
      fetch('/api/demo', { method: 'POST' }).then(function(r) { return r.json(); }).then(function(d) {
        statusEl.textContent = 'Done. Total drafts saved: ' + d.draftsSaved;
        statusEl.className = 'ok';
        fetchMetrics();
      }).catch(function() {
        statusEl.textContent = 'Request failed.';
        statusEl.className = 'err';
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`[BACKEND] Server running on http://localhost:${PORT}`);
});

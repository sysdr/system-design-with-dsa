(function () {
  const BASE = "";

  function el(id) {
    return document.getElementById(id);
  }

  function formatTime(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      });
    } catch {
      return iso;
    }
  }

  function formatLogTime(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "." + String(d.getMilliseconds()).padStart(3, "0");
    } catch {
      return iso;
    }
  }

  function renderLogs(logs) {
    var pre = el("demoLogsPre");
    if (!pre) return;
    if (!logs || logs.length === 0) {
      pre.innerHTML = "<span class=\"demo-logs-empty\" id=\"demoLogsEmpty\">No demo run yet. Click \"Run demo\" to see logs.</span>";
      return;
    }
    pre.innerHTML = logs.map(function (entry) {
      var ts = formatLogTime(entry.ts);
      var source = entry.source === "frontend" ? "frontend" : "backend";
      var line = String(entry.line).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return "<span class=\"log-line\"><span class=\"log-ts\">" + ts + "</span><span class=\"log-source " + source + "\">[" + source + "]</span>" + line + "</span>";
    }).join("\n");
    var container = el("demoLogsContainer");
    if (container) container.scrollTop = container.scrollHeight;
  }

  function render(metrics) {
    el("demoRuns").textContent = metrics.demo_runs ?? 0;
    el("frontendRuns").textContent = metrics.frontend_runs ?? 0;
    el("backendRuns").textContent = metrics.backend_runs ?? 0;
    el("lastDemo").textContent = formatTime(metrics.last_demo_at ?? null);

    [el("demoRuns"), el("frontendRuns"), el("backendRuns")].forEach(function (node) {
      node.closest(".metric-card").classList.add("updated");
      setTimeout(function () {
        node.closest(".metric-card").classList.remove("updated");
      }, 400);
    });
  }

  function fetchMetrics() {
    fetch(BASE + "/api/metrics")
      .then(function (r) {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(render)
      .catch(function () {
        render({
          demo_runs: 0,
          frontend_runs: 0,
          backend_runs: 0,
          last_demo_at: null,
        });
      });
  }

  // Prefer SSE for real-time updates; fallback to polling
  function connectStream() {
    var es = new EventSource(BASE + "/api/metrics/stream");
    es.onmessage = function (e) {
      try {
        render(JSON.parse(e.data));
      } catch (_) {}
    };
    es.onerror = function () {
      es.close();
      setInterval(fetchMetrics, 2000);
    };
  }

  if (typeof EventSource !== "undefined") {
    connectStream();
  } else {
    setInterval(fetchMetrics, 2000);
  }

  fetchMetrics();
  fetch(BASE + "/api/demo-logs").then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) { if (d.logs && d.logs.length) renderLogs(d.logs); }).catch(function () {});

  // Run demo from dashboard
  var runBtn = el("runDemoBtn");
  if (runBtn) {
    runBtn.addEventListener("click", function () {
      if (runBtn.disabled) return;
      runBtn.disabled = true;
      runBtn.classList.add("loading");
      fetch(BASE + "/api/run-demo", { method: "POST", headers: { "Content-Type": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.statusText);
          return r.json();
        })
        .then(function (data) {
          if (data.metrics) render(data.metrics);
          renderLogs(data.logs || []);
        })
        .catch(function () {
          if (typeof fetchMetrics === "function") fetchMetrics();
        })
        .finally(function () {
          runBtn.disabled = false;
          runBtn.classList.remove("loading");
        });
    });
  }
})();

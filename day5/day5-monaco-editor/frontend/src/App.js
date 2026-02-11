import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

const debounce = (func, delay) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const DRAFT_STATUS = {
  IDLE: 'idle',       // no message, or "Ready"
  SAVING: 'saving',   // "Saving…"
  SAVED: 'saved',     // "Draft saved"
  ERROR: 'error',     // "Failed to save"
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function App() {
  const [problemList, setProblemList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [draftStatus, setDraftStatus] = useState(DRAFT_STATUS.IDLE);
  const [loadError, setLoadError] = useState(null);

  // Fetch list of problems on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/problems`)
      .then((r) => r.json())
      .then((list) => {
        setProblemList(list);
        if (list.length && !selectedId) setSelectedId(list[0].id);
      })
      .catch((e) => setLoadError('Could not load problem list.'));
  }, []);

  // Fetch selected problem details
  useEffect(() => {
    if (!selectedId) return;
    setLoadError(null);
    setProblem(null);
    fetch(`${API_BASE}/api/problems/${selectedId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        setProblem(data);
        setCurrentCode(data.defaultCode || '');
        setDraftStatus(DRAFT_STATUS.IDLE);
      })
      .catch(() => setLoadError('Failed to load this problem.'));
  }, [selectedId]);

  const saveDraft = useCallback(
    async (code) => {
      if (!problem) return;
      setDraftStatus(DRAFT_STATUS.SAVING);
      try {
        const response = await fetch(
          `${API_BASE}/api/problems/${problem.id}/draft`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language: problem.language }),
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        setDraftStatus(DRAFT_STATUS.SAVED);
        setTimeout(() => setDraftStatus(DRAFT_STATUS.IDLE), 2000);
      } catch (e) {
        setDraftStatus(DRAFT_STATUS.ERROR);
      }
    },
    [problem]
  );

  const debouncedSaveDraft = useCallback(
    debounce((code) => saveDraft(code), 1000),
    [saveDraft]
  );

  const handleEditorChange = (value) => {
    setCurrentCode(value);
    debouncedSaveDraft(value);
  };

  if (loadError && !problemList.length) {
    return (
      <div className="App App--centered">
        <p className="App-error">{loadError}</p>
        <p className="App-hint">Ensure the backend is running on port 3001.</p>
      </div>
    );
  }

  if (!problem && selectedId) {
    return (
      <div className="App App--centered">
        <p className="App-loading">Loading problem…</p>
      </div>
    );
  }

  if (!problem && !loadError) {
    return (
      <div className="App App--centered">
        <p className="App-hint">Select a problem to start.</p>
      </div>
    );
  }

  if (loadError && problemList.length) {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Code Practice</h1>
          <p className="App-subtitle">Pick a problem and write your solution.</p>
        </header>
        <aside className="App-sidebar">
          <h2 className="App-sidebarTitle">Problems</h2>
          <ul className="App-problemList" role="list">
            {problemList.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`App-problemBtn ${p.id === selectedId ? 'App-problemBtn--active' : ''}`}
                  onClick={() => { setSelectedId(p.id); setLoadError(null); }}
                >
                  <span className="App-problemBtnTitle">{p.title}</span>
                  {p.difficulty && (
                    <span className={`App-problemBtnBadge App-problemBtnBadge--${(p.difficulty || '').toLowerCase()}`}>
                      {p.difficulty}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="App-main">
          <p className="App-error">{loadError}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">Code Practice</h1>
        <p className="App-subtitle">Pick a problem and write your solution. Your draft auto-saves as you type.</p>
      </header>

      <aside className="App-sidebar">
        <h2 className="App-sidebarTitle">Problems</h2>
        <ul className="App-problemList" role="list">
          {problemList.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`App-problemBtn ${p.id === selectedId ? 'App-problemBtn--active' : ''}`}
                onClick={() => setSelectedId(p.id)}
              >
                <span className="App-problemBtnTitle">{p.title}</span>
                {p.difficulty && (
                  <span className={`App-problemBtnBadge App-problemBtnBadge--${(p.difficulty || '').toLowerCase()}`}>
                    {p.difficulty}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="App-main">
        <div className="App-problemHeader">
          <h2 className="App-problemName">{problem.title}</h2>
          {problem.difficulty && (
            <span className={`App-difficulty App-difficulty--${(problem.difficulty || '').toLowerCase()}`}>
              {problem.difficulty}
            </span>
          )}
        </div>
        <div className="App-description">
          <pre>{problem.description}</pre>
        </div>
        <div className="App-editorWrap">
          <Editor
            height="55vh"
            language={problem.language}
            value={currentCode}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
        <footer className="App-footer">
          <span className="App-footerHint">Draft auto-saves as you type.</span>
          <span
            className={`App-draftStatus App-draftStatus--${draftStatus}`}
            role="status"
            aria-live="polite"
          >
            {draftStatus === DRAFT_STATUS.IDLE && 'Ready'}
            {draftStatus === DRAFT_STATUS.SAVING && 'Saving…'}
            {draftStatus === DRAFT_STATUS.SAVED && 'Draft saved'}
            {draftStatus === DRAFT_STATUS.ERROR && 'Failed to save draft'}
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;

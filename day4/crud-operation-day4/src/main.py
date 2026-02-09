from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from . import crud, models, schemas
from .database import engine, SessionLocal, get_db, create_db_tables

# Create tables on startup (if they don't exist)
create_db_tables()

app = FastAPI(
    title="Competitive Programming Problem Manager",
    description="Manage problems, users, and submissions for a competitive programming platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- Problem Endpoints ---
@app.post("/problems/", response_model=schemas.ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_problem(problem: schemas.ProblemCreate, db: Session = Depends(get_db)):
    db_problem = crud.get_problem_by_title(db, problem.title)
    if db_problem:
        raise HTTPException(status_code=400, detail="Problem with this title already exists")
    return crud.create_problem(db=db, problem=problem)

@app.get("/problems/", response_model=List[schemas.ProblemResponse])
def read_problems(skip: int = 0, limit: int = 100,
                  title: Optional[str] = None,
                  difficulty: Optional[str] = None,
                  tags: Optional[str] = None,
                  db: Session = Depends(get_db)):
    problems = crud.get_problems(db, skip=skip, limit=limit,
                                 title_filter=title,
                                 difficulty_filter=difficulty,
                                 tags_filter=tags)
    return problems

@app.get("/problems/{problem_id}", response_model=schemas.ProblemResponse)
def read_problem(problem_id: int, db: Session = Depends(get_db)):
    db_problem = crud.get_problem(db, problem_id=problem_id)
    if db_problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return db_problem

@app.put("/problems/{problem_id}", response_model=schemas.ProblemResponse)
def update_problem(problem_id: int, problem: schemas.ProblemUpdate, db: Session = Depends(get_db)):
    db_problem = crud.update_problem(db, problem_id=problem_id, problem=problem)
    if db_problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return db_problem

@app.delete("/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(problem_id: int, db: Session = Depends(get_db)):
    db_problem = crud.delete_problem(db, problem_id=problem_id)
    if db_problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"message": "Problem deleted successfully"}

# Root endpoint for health check
@app.get("/")
async def root():
    return {"message": "Competitive Programming Problem Manager API is running!"}

# --- Stats for Dashboard ---
@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total = db.query(func.count(models.Problem.id)).scalar() or 0
    easy = db.query(func.count(models.Problem.id)).filter(models.Problem.difficulty == "Easy").scalar() or 0
    medium = db.query(func.count(models.Problem.id)).filter(models.Problem.difficulty == "Medium").scalar() or 0
    hard = db.query(func.count(models.Problem.id)).filter(models.Problem.difficulty == "Hard").scalar() or 0
    return {"total": total, "easy": easy, "medium": medium, "hard": hard}

# --- Dashboard HTML (metrics + project info + operations) ---
@app.get("/dashboard", include_in_schema=False)
async def dashboard_html():
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Problem Manager Dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 0 auto; padding: 1.5rem; background: #f0f2f5; color: #1a1a1a; }
    header { text-align: center; margin-bottom: 1.5rem; }
    header h1 { margin: 0; font-size: 1.75rem; color: #1565c0; }
    header p { margin: 0.25rem 0 0; font-size: 0.9rem; color: #555; }
    .card { background: #fff; padding: 1.25rem 1.5rem; margin-bottom: 1rem; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .card h2 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    .info { font-size: 0.9rem; line-height: 1.5; color: #444; }
    .info strong { color: #1565c0; }
    .metrics { display: flex; flex-wrap: wrap; gap: 1rem; align-items: baseline; margin: 0.75rem 0; }
    .metric-box { display: inline-flex; align-items: baseline; gap: 0.25rem; }
    .metric { font-size: 1.5rem; font-weight: 700; color: #1565c0; }
    .metric-label { font-size: 0.85rem; color: #666; }
    .ops { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
    .ops label { font-size: 0.85rem; color: #555; margin-right: 0.25rem; }
    button, .btn { display: inline-block; background: #1565c0; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; text-decoration: none; }
    button:hover, .btn:hover { background: #0d47a1; color: #fff; }
    button.secondary { background: #607d8b; }
    button.secondary:hover { background: #455a64; }
    input[type="number"] { width: 4rem; padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; }
    #msg { font-size: 0.9rem; margin-left: 0.5rem; color: #2e7d32; }
    #out { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 0.75rem; font-size: 0.8rem; font-family: monospace; white-space: pre-wrap; word-break: break-all; max-height: 220px; overflow-y: auto; margin-top: 0.5rem; }
    .link { font-size: 0.9rem; margin-top: 0.5rem; }
    .link a { color: #1565c0; }
  </style>
</head>
<body>
  <header>
    <h1>Problem Manager Dashboard</h1>
    <p>Day 4 — CRUD with efficient indexing</p>
  </header>

  <section class="card">
    <h2>About this project</h2>
    <div class="info">
      <p><strong>Competitive Programming Problem Manager</strong> — A small API to manage algorithm problems (title, description, difficulty, tags).</p>
      <p>Uses <strong>FastAPI</strong> + <strong>SQLite</strong> with indexes on difficulty and tags for fast filters. You can list, create, update, and delete problems. Try the operations below to see how it works.</p>
    </div>
  </section>

  <section class="card">
    <h2>Metrics</h2>
    <div class="metrics">
      <span class="metric-box"><span class="metric" id="total">0</span><span class="metric-label"> total</span></span>
      <span class="metric-box"><span class="metric" id="easy">0</span><span class="metric-label"> Easy</span></span>
      <span class="metric-box"><span class="metric" id="medium">0</span><span class="metric-label"> Medium</span></span>
      <span class="metric-box"><span class="metric" id="hard">0</span><span class="metric-label"> Hard</span></span>
    </div>
    <p style="margin:0;font-size:0.85rem;color:#666;">Updates every 5s. Use &quot;Run demo&quot; to add a problem and see numbers change.</p>
  </section>

  <section class="card">
    <h2>Operations</h2>
    <div class="ops">
      <button onclick="viewAll()">View all problems</button>
      <button class="secondary" onclick="filterBy('Easy')">Filter: Easy</button>
      <button class="secondary" onclick="filterBy('Medium')">Filter: Medium</button>
      <button class="secondary" onclick="filterBy('Hard')">Filter: Hard</button>
      <label for="pid">ID:</label><input type="number" id="pid" min="1" placeholder="1">
      <button onclick="viewOne()">View problem</button>
      <button onclick="runDemo()">Run demo (add problem)</button>
      <span id="msg"></span>
    </div>
    <div id="out"></div>
    <p class="link"><a href="/docs" target="_blank">Open API docs (Swagger)</a> · <a href="/redoc" target="_blank">ReDoc</a></p>
  </section>

  <script>
    var out = document.getElementById('out');
    function show(s) { out.textContent = typeof s === 'string' ? s : JSON.stringify(s, null, 2); }
    function refresh(){
      fetch('/stats').then(r=>r.json()).then(d=>{
        document.getElementById('total').textContent = d.total;
        document.getElementById('easy').textContent = d.easy;
        document.getElementById('medium').textContent = d.medium;
        document.getElementById('hard').textContent = d.hard;
      });
    }
    function viewAll(){
      show('Loading...');
      fetch('/problems/').then(r=>r.json()).then(show).catch(e=>show('Error: ' + e.message));
    }
    function filterBy(diff){
      show('Loading...');
      fetch('/problems/?difficulty=' + encodeURIComponent(diff)).then(r=>r.json()).then(show).catch(e=>show('Error: ' + e.message));
    }
    function viewOne(){
      var id = document.getElementById('pid').value || '1';
      show('Loading...');
      fetch('/problems/' + id).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(show).catch(e=>show('Error: ' + e.message));
    }
    function runDemo(){
      document.getElementById('msg').textContent = ' Running...';
      fetch('/problems/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Demo Problem ' + Date.now(), description: 'Created from dashboard.', difficulty: 'Easy', tags: 'Demo', is_published: true })
      }).then(r=>r.ok ? r.json() : Promise.reject()).then(function(d){ document.getElementById('msg').textContent = ' Done!'; show('Created: ' + JSON.stringify(d, null, 2)); refresh(); }).catch(function(){ document.getElementById('msg').textContent = ' Error'; });
    }
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(
        content=html,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
    )

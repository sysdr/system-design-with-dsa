from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

def create_problem(db: Session, problem: schemas.ProblemCreate):
    db_problem = models.Problem(**problem.model_dump())
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    return db_problem

def get_problem(db: Session, problem_id: int):
    return db.query(models.Problem).filter(models.Problem.id == problem_id).first()

def get_problem_by_title(db: Session, title: str):
    return db.query(models.Problem).filter(models.Problem.title == title).first()

def get_problems(db: Session, skip: int = 0, limit: int = 100,
                 title_filter: str | None = None,
                 difficulty_filter: str | None = None,
                 tags_filter: str | None = None):
    query = db.query(models.Problem)
    if title_filter:
        query = query.filter(models.Problem.title.ilike(f"%{title_filter}%"))
    if difficulty_filter:
        query = query.filter(models.Problem.difficulty == difficulty_filter)
    if tags_filter:
        # For simplicity, checking if the tag string contains the filter.
        # For real-world, consider a many-to-many relationship with a 'tags' table.
        query = query.filter(models.Problem.tags.ilike(f"%{tags_filter}%"))
    return query.offset(skip).limit(limit).all()

def update_problem(db: Session, problem_id: int, problem: schemas.ProblemUpdate):
    db_problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if db_problem:
        update_data = problem.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_problem, key, value)
        db.add(db_problem)
        db.commit()
        db.refresh(db_problem)
    return db_problem

def delete_problem(db: Session, problem_id: int):
    db_problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if db_problem:
        db.delete(db_problem)
        db.commit()
    return db_problem

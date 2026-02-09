from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///./{os.getenv('DB_FILE', 'instance.db')}")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_db_tables():
    # Import models here to ensure they are registered with Base
    from . import models
    Base.metadata.create_all(bind=engine)
    print(f"Database tables created at {DATABASE_URL}")

if __name__ == "__main__":
    create_db_tables()

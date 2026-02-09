from sqlalchemy import Column, Integer, String, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from .database import Base

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True)
    description = Column(String)
    difficulty = Column(String, index=True) # e.g., "Easy", "Medium", "Hard"
    tags = Column(String) # Comma-separated string, e.g., "Array,DP"
    is_published = Column(Boolean, default=True)

    __table_args__ = (
        Index('idx_difficulty_tags', 'difficulty', 'tags'), # Compound index for common queries
    )

    def __repr__(self):
        return f"<Problem(id={self.id}, title='{self.title}', difficulty='{self.difficulty}')>"

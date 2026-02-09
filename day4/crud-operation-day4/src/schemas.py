from pydantic import BaseModel, Field
from typing import Optional, List

class ProblemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    difficulty: str = Field(..., pattern="^(Easy|Medium|Hard)$")
    tags: str = Field(..., description="Comma-separated string of tags, e.g., 'Array,DP'")
    is_published: bool = True

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    difficulty: Optional[str] = Field(None, pattern="^(Easy|Medium|Hard)$")
    tags: Optional[str] = Field(None, description="Comma-separated string of tags, e.g., 'Array,DP'")
    is_published: Optional[bool] = None

class ProblemResponse(ProblemBase):
    id: int

    class Config:
        from_attributes = True # For SQLAlchemy 2.0+ orm_mode = True in Pydantic 1.x

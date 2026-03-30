from pydantic import BaseModel
from typing import Optional, List, Any

class LoginRequest(BaseModel):
    base_url: str  # e.g. "https://campus.domain.org"
    district: str
    username: str
    password: str

class CourseResponse(BaseModel):
    id: str
    name: str
    grade: Optional[str] = None
    term: Optional[str] = None

class AssignmentResponse(BaseModel):
    name: str
    score: Optional[float] = None
    total_points: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None

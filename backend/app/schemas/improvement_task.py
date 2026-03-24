from pydantic import BaseModel
from typing import Optional


class ImprovementTaskCreateIn(BaseModel):
    store_id: str
    inspection_id: Optional[str] = None
    category: str  # 품질, 위생, 매출, 인력, 상권, 기타
    task_description: str
    priority: str = "중간"  # 높음, 중간, 낮음
    status: str = "미처리"
    due_date: Optional[str] = None  # ISO format datetime


class ImprovementTaskUpdateIn(BaseModel):
    category: Optional[str] = None
    task_description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    completion_notes: Optional[str] = None


class ImprovementTaskStatusUpdateIn(BaseModel):
    status: str  # 미처리, 진행중, 완료, 보류
    completion_notes: Optional[str] = None


class ImprovementTaskOut(BaseModel):
    id: str
    store_id: str
    store_name: Optional[str] = None
    inspection_id: Optional[str] = None
    category: str
    task_description: str
    priority: str
    status: str
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    completion_notes: Optional[str] = None
    created_at: str
    updated_at: str

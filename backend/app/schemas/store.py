from pydantic import BaseModel
from typing import Optional


class StoreCreateIn(BaseModel):
    store_name: str
    region: str
    address: Optional[str] = None
    supervisor_id: Optional[str] = None
    store_size: Optional[int] = None
    opening_date: Optional[str] = None  # ISO format datetime
    status: str = "운영중"


class StoreUpdateIn(BaseModel):
    store_name: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    supervisor_id: Optional[str] = None
    store_size: Optional[int] = None
    opening_date: Optional[str] = None
    status: Optional[str] = None


class StoreOut(BaseModel):
    id: str
    store_name: str
    region: str
    address: Optional[str] = None
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    store_size: Optional[int] = None
    opening_date: Optional[str] = None
    status: str
    created_at: str
    updated_at: str


class StoreHealthScoreOut(BaseModel):
    store_id: str
    store_name: str
    quality_score: float  # 0-100
    hygiene_score: float  # 0-100
    sales_score: float  # 0-100
    overall_score: float  # 0-100
    pending_tasks_count: int
    last_inspection_date: Optional[str] = None

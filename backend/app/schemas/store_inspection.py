from pydantic import BaseModel
from typing import Optional


class StoreInspectionCreateIn(BaseModel):
    inspection_date: str  # ISO format datetime
    quality_status: str  # 양호, 미흡
    quality_notes: Optional[str] = None
    hygiene_status: str  # 양호, 미흡
    hygiene_notes: Optional[str] = None
    sales_note: Optional[str] = None
    owner_feedback: Optional[str] = None


class StoreInspectionUpdateIn(BaseModel):
    quality_status: Optional[str] = None
    quality_notes: Optional[str] = None
    hygiene_status: Optional[str] = None
    hygiene_notes: Optional[str] = None
    sales_note: Optional[str] = None
    owner_feedback: Optional[str] = None


class StoreInspectionOut(BaseModel):
    id: str
    store_id: str
    store_name: Optional[str] = None
    supervisor_id: str
    supervisor_name: Optional[str] = None
    inspection_date: str
    quality_status: str
    quality_notes: Optional[str] = None
    hygiene_status: str
    hygiene_notes: Optional[str] = None
    sales_note: Optional[str] = None
    owner_feedback: Optional[str] = None
    created_at: str
    updated_at: str

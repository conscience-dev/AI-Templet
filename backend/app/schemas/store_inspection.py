from pydantic import BaseModel
from typing import Optional, Any


class StoreInspectionCreateIn(BaseModel):
    store_id: str
    inspection_date: str  # ISO format datetime
    quality_status: str  # 준수, 미흡
    quality_notes: Optional[str] = None
    hygiene_status: str  # 양호, 미흡
    hygiene_notes: Optional[str] = None
    sales_amount: Optional[int] = None
    sales_yoy_change: Optional[float] = None
    sales_mom_change: Optional[float] = None
    staff_count: Optional[dict] = None
    market_change: Optional[str] = None
    owner_feedback: Optional[str] = None
    improvement_items: Optional[list] = None


class StoreInspectionUpdateIn(BaseModel):
    inspection_date: Optional[str] = None
    quality_status: Optional[str] = None
    quality_notes: Optional[str] = None
    hygiene_status: Optional[str] = None
    hygiene_notes: Optional[str] = None
    sales_amount: Optional[int] = None
    sales_yoy_change: Optional[float] = None
    sales_mom_change: Optional[float] = None
    staff_count: Optional[dict] = None
    market_change: Optional[str] = None
    owner_feedback: Optional[str] = None
    improvement_items: Optional[list] = None


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
    sales_amount: Optional[int] = None
    sales_yoy_change: Optional[float] = None
    sales_mom_change: Optional[float] = None
    staff_count: Optional[Any] = None
    market_change: Optional[str] = None
    owner_feedback: Optional[str] = None
    improvement_items: Optional[Any] = None
    created_at: str
    updated_at: str

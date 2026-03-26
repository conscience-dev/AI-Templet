from pydantic import BaseModel
from typing import Optional


class StoreCreateIn(BaseModel):
    store_name: str
    region: str
    address: Optional[str] = None
    supervisor_id: Optional[str] = None
    status: str = "운영중"


class StoreUpdateIn(BaseModel):
    store_name: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    supervisor_id: Optional[str] = None
    status: Optional[str] = None


class StoreOut(BaseModel):
    id: str
    store_name: str
    region: str
    address: Optional[str] = None
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    status: str
    created_at: str
    updated_at: str

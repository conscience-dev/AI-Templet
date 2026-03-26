from pydantic import BaseModel
from typing import Optional


class ProspectCreateIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    inquiry_path: str  # Enum value: 매장방문, 매체광고, 인터넷검색, 소개추천, 기타
    hope_region: Optional[str] = None
    startup_budget: Optional[int] = None
    status: str = "신규"
    assigned_user_id: Optional[str] = None
    memo: Optional[str] = None


class ProspectUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    inquiry_path: Optional[str] = None
    hope_region: Optional[str] = None
    startup_budget: Optional[int] = None
    status: Optional[str] = None
    assigned_user_id: Optional[str] = None
    memo: Optional[str] = None


class ProspectOut(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    inquiry_path: str
    hope_region: Optional[str] = None
    startup_budget: Optional[int] = None
    status: str
    assigned_user_id: Optional[str] = None
    assigned_user_name: Optional[str] = None
    memo: Optional[str] = None
    created_at: str
    updated_at: str

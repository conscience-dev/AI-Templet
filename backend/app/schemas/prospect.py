from pydantic import BaseModel
from typing import Optional


class ProspectCreateIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    inquiry_path: str  # Enum value: 매장방문, 매체광고, 인터넷검색, 소개추천, 기타
    hope_region: Optional[str] = None
    startup_budget: Optional[int] = None
    tasted: bool = False
    status: str = "신규"


class ProspectUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    inquiry_path: Optional[str] = None
    hope_region: Optional[str] = None
    startup_budget: Optional[int] = None
    tasted: Optional[bool] = None
    status: Optional[str] = None


class ProspectOut(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    inquiry_path: str
    hope_region: Optional[str] = None
    startup_budget: Optional[int] = None
    tasted: bool
    status: str
    created_at: str
    updated_at: str


class ConversionAnalyticsOut(BaseModel):
    total_prospects: int
    status_counts: dict  # {"신규": 10, "진행중": 5, "성약": 3, "종료": 2}
    conversion_rate: float  # 성약 / 전체 비율
    avg_consultations_to_contract: Optional[float] = None  # 성약까지 평균 상담 횟수

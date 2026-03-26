from pydantic import BaseModel
from typing import Optional


class ConsultationCreateIn(BaseModel):
    consultation_order: int
    consultation_date: str  # ISO format datetime
    content: str
    result: str  # Enum value: 긍정, 보통, 부정, 종료
    next_action: Optional[str] = None


class ConsultationOut(BaseModel):
    id: str
    prospect_id: str
    prospect_name: Optional[str] = None
    consultation_order: int
    consultant_id: str
    consultant_name: Optional[str] = None
    consultation_date: str
    content: str
    result: str
    next_action: Optional[str] = None
    created_at: str
    updated_at: str

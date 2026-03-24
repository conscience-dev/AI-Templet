from pydantic import BaseModel
from typing import Optional


class ConsultationCreateIn(BaseModel):
    prospect_id: str
    consultation_order: int
    consultation_date: str  # ISO format datetime
    content: str
    result: str  # Enum value: A가망고객, B지속고객, C종료의지없음
    next_action: Optional[str] = None


class ConsultationUpdateIn(BaseModel):
    consultation_date: Optional[str] = None
    content: Optional[str] = None
    result: Optional[str] = None
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

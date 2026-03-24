import enum
import uuid

from sqlalchemy import String, Integer, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class ConsultationResult(str, enum.Enum):
    A_PROSPECT = "A가망고객"
    B_ONGOING = "B지속고객"
    C_NO_INTENT = "C종료의지없음"


class Consultation(BaseModel):
    __tablename__ = "consultations"

    prospect_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False
    )
    consultation_order: Mapped[int] = mapped_column(Integer, nullable=False)
    consultant_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    consultation_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[ConsultationResult] = mapped_column(
        Enum(ConsultationResult, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    next_action: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    prospect = relationship("Prospect", back_populates="consultations")
    consultant = relationship("User", backref="consultations")

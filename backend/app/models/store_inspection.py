import enum
import uuid

from sqlalchemy import Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class QualityStatus(str, enum.Enum):
    GOOD = "양호"
    POOR = "미흡"


class HygieneStatus(str, enum.Enum):
    GOOD = "양호"
    POOR = "미흡"


class StoreInspection(BaseModel):
    __tablename__ = "store_inspections"

    store_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False
    )
    supervisor_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    inspection_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    quality_status: Mapped[QualityStatus] = mapped_column(
        Enum(QualityStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    quality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    hygiene_status: Mapped[HygieneStatus] = mapped_column(
        Enum(HygieneStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    hygiene_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    sales_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    store = relationship("Store", back_populates="inspections")
    supervisor = relationship("User", backref="inspections")

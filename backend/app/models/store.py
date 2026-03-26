import enum
import uuid

from sqlalchemy import String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class StoreStatus(str, enum.Enum):
    OPERATING = "운영중"
    PAUSED = "휴점"
    CLOSED = "폐점"


class Store(BaseModel):
    __tablename__ = "stores"

    store_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(String(200), nullable=True)
    supervisor_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[StoreStatus] = mapped_column(
        Enum(StoreStatus, values_callable=lambda x: [e.value for e in x]),
        default=StoreStatus.OPERATING,
        nullable=False,
    )

    # Relationships
    supervisor = relationship("User", backref="supervised_stores")
    inspections = relationship("StoreInspection", back_populates="store", cascade="all, delete-orphan")
    improvement_tasks = relationship("ImprovementTask", back_populates="store", cascade="all, delete-orphan")

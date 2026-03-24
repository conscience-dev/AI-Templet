import enum
import uuid

from sqlalchemy import Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class TaskCategory(str, enum.Enum):
    QUALITY = "품질"
    HYGIENE = "위생"
    SALES = "매출"
    STAFF = "인력"
    MARKET = "상권"
    OTHER = "기타"


class TaskPriority(str, enum.Enum):
    HIGH = "높음"
    MEDIUM = "중간"
    LOW = "낮음"


class TaskStatus(str, enum.Enum):
    PENDING = "미처리"
    IN_PROGRESS = "진행중"
    COMPLETED = "완료"
    ON_HOLD = "보류"


class ImprovementTask(BaseModel):
    __tablename__ = "improvement_tasks"

    store_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False
    )
    inspection_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("store_inspections.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[TaskCategory] = mapped_column(
        Enum(TaskCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    task_description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority, values_callable=lambda x: [e.value for e in x]),
        default=TaskPriority.MEDIUM,
        nullable=False,
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, values_callable=lambda x: [e.value for e in x]),
        default=TaskStatus.PENDING,
        nullable=False,
    )
    due_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completion_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    store = relationship("Store", back_populates="improvement_tasks")
    inspection = relationship("StoreInspection", backref="tasks")

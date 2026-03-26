import enum
import uuid

from sqlalchemy import String, Integer, Text, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class InquiryPath(str, enum.Enum):
    STORE_VISIT = "매장방문"
    MEDIA_AD = "매체광고"
    INTERNET_SEARCH = "인터넷검색"
    REFERRAL = "소개추천"
    OTHER = "기타"


class ProspectStatus(str, enum.Enum):
    NEW = "신규"
    IN_CONSULTATION = "상담중"
    ON_HOLD = "보류"
    CONTRACTED = "성약"
    CLOSED = "종료"


class Prospect(BaseModel):
    __tablename__ = "prospects"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    inquiry_path: Mapped[InquiryPath] = mapped_column(
        Enum(InquiryPath, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    hope_region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    startup_budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[ProspectStatus] = mapped_column(
        Enum(ProspectStatus, values_callable=lambda x: [e.value for e in x]),
        default=ProspectStatus.NEW,
        nullable=False,
    )
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    assigned_user = relationship("User", backref="assigned_prospects")
    consultations = relationship("Consultation", back_populates="prospect", cascade="all, delete-orphan")

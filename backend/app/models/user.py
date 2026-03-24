import enum
import uuid

from sqlalchemy import String, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class UserStatus(str, enum.Enum):
    PENDING = "승인대기"
    ADMIN = "관리자"
    ACTIVE = "활성"
    INACTIVE = "비활성유저"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EXECUTIVE = "executive"
    DEV_MANAGER = "dev_manager"
    DEV_STAFF = "dev_staff"
    SUPERVISOR_MANAGER = "supervisor_manager"
    SUPERVISOR = "supervisor"


class User(BaseModel):
    __tablename__ = "user"

    username: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, values_callable=lambda x: [e.value for e in x]),
        default=UserStatus.PENDING,
        nullable=False,
    )
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    terms_of_service: Mapped[bool] = mapped_column(Boolean, default=False)
    privacy_policy_agreement: Mapped[bool] = mapped_column(Boolean, default=False)

    # 이비가푸드 추가 필드
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole | None] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    jwt: Mapped["Jwt | None"] = relationship("Jwt", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Jwt(BaseModel):
    __tablename__ = "jwt"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("user.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    access: Mapped[str] = mapped_column(Text, nullable=False)
    refresh: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="jwt")

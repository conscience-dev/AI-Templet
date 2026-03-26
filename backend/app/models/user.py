import enum
import uuid

from sqlalchemy import String, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"


class DepartmentType(str, enum.Enum):
    DEV = "dev"
    SUPERVISOR = "supervisor"
    EXECUTIVE = "executive"
    ADMIN = "admin"


class User(BaseModel):
    __tablename__ = "user"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    department: Mapped[DepartmentType | None] = mapped_column(
        Enum(DepartmentType, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
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

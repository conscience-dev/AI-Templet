from pydantic import BaseModel
from typing import Optional


class UserCreateIn(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None


class UserLoginIn(BaseModel):
    email: str
    password: str


class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class RefreshTokenIn(BaseModel):
    refresh_token: str


class UserMeOut(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None


class UserLoginOut(BaseModel):
    access_token: str
    refresh_token: str
    status: str


class UserRefreshTokenOut(BaseModel):
    access_token: str
    refresh_token: str

from pydantic import BaseModel
from typing import Optional


class UserSignupIn(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    password_confirm: str
    phone: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    terms_of_service: bool
    privacy_policy_agreement: bool


class UserLoginIn(BaseModel):
    username: str
    password: str


class UserUpdateIn(BaseModel):
    status: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class RefreshTokenIn(BaseModel):
    refresh_token: str


class UserMeOut(BaseModel):
    id: Optional[str] = None
    username: str
    email: Optional[str] = None
    status: str
    phone: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True
    terms_of_service: bool
    privacy_policy_agreement: bool
    created_at: Optional[str] = None


class UserLoginOut(BaseModel):
    access_token: str
    refresh_token: str
    status: str


class UserRefreshTokenOut(BaseModel):
    access_token: str
    refresh_token: str

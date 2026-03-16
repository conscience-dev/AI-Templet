import jwt
import random
import string
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_random(length: int) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def get_access_token(payload: dict) -> tuple[str, datetime]:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRATION_MINUTES)

    serializable_payload = {}
    for key, value in payload.items():
        if hasattr(value, "hex"):  # UUID
            serializable_payload[key] = str(value)
        else:
            serializable_payload[key] = value

    token = jwt.encode(
        {"exp": exp, **serializable_payload},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return token, exp


def get_refresh_token() -> tuple[str, datetime]:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRATION_MINUTES)
    token = jwt.encode(
        {"exp": exp, "data": get_random(10)},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return token, exp


def validate_refresh_token(token: str) -> dict:
    try:
        decoded = jwt.decode(token, key=settings.SECRET_KEY, algorithms=["HS256"])
        exp_datetime = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        if exp_datetime < datetime.now(timezone.utc):
            raise ValueError("토큰이 만료되었습니다.")
        return decoded
    except jwt.ExpiredSignatureError:
        raise ValueError("토큰이 만료되었습니다.")
    except jwt.DecodeError:
        raise ValueError("올바르지 않은 토큰입니다.")


def decode_access_token(token: str) -> dict | None:
    try:
        decoded = jwt.decode(token, key=settings.SECRET_KEY, algorithms=["HS256"])
        exp_datetime = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        if exp_datetime < datetime.now(timezone.utc):
            return None
        return decoded
    except (jwt.ExpiredSignatureError, jwt.DecodeError):
        return None

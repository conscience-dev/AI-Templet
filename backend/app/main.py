import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth

logger = logging.getLogger(__name__)

app = FastAPI(
    title="API",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers — SPEC.md 기반 생성 시 여기에 라우터 추가
app.include_router(auth.router, prefix="/v1/auth", tags=["Users"])
# app.include_router(admin.router, prefix="/v1/admin", tags=["Admin"])
# app.include_router(chat.router, prefix="/v1/chat", tags=["Chat"])


@app.get("/")
async def health_check():
    return {"status": "healthy", "env": settings.ENV_NAME}

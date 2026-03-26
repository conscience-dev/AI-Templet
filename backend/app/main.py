import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    prospect,
    consultation,
    store,
    store_inspection,
    improvement_task,
    dashboard,
    claude_token,
    marketing,
    supervisor,
    alerts,
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="이비가푸드 AI 자산화 업무툴 API",
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

# Routers
app.include_router(auth.router, prefix="/v1/auth", tags=["Auth"])
app.include_router(claude_token.router, prefix="/v1/auth", tags=["Auth"])
app.include_router(prospect.router, prefix="/v1/prospects", tags=["Prospects"])
app.include_router(consultation.router, prefix="/v1/consultations", tags=["Consultations"])
app.include_router(store.router, prefix="/v1/stores", tags=["Stores"])
app.include_router(store_inspection.router, prefix="/v1/inspections", tags=["Inspections"])
app.include_router(improvement_task.router, prefix="/v1/improvement-tasks", tags=["ImprovementTasks"])
app.include_router(dashboard.router, prefix="/v1/dashboard", tags=["Dashboard"])
app.include_router(marketing.router, prefix="/v1/marketing", tags=["Marketing"])
app.include_router(supervisor.router, prefix="/v1/supervisors", tags=["Supervisors"])
app.include_router(alerts.router, prefix="/v1/alerts", tags=["Alerts"])


@app.get("/")
async def health_check():
    return {"status": "healthy", "env": settings.ENV_NAME}

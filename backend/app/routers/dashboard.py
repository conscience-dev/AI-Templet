from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.prospect import Prospect, ProspectStatus
from app.models.consultation import Consultation
from app.models.store import Store, StoreStatus
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskStatus, TaskCategory
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/executive-summary")
async def executive_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """경영진 대시보드 (전사 지표 요약)."""
    if user.role not in [UserRole.ADMIN, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="경영진 권한이 필요합니다.")

    # 가맹문의자 현황
    prospect_result = await db.execute(select(Prospect))
    prospects = list(prospect_result.scalars().all())
    prospect_total = len(prospects)
    prospect_status = {}
    for p in prospects:
        val = p.status.value
        prospect_status[val] = prospect_status.get(val, 0) + 1

    # 전환율
    contracted = prospect_status.get("성약", 0)
    conversion_rate = round((contracted / prospect_total * 100), 2) if prospect_total > 0 else 0.0

    # 점포 현황
    store_result = await db.execute(select(Store))
    stores = list(store_result.scalars().all())
    store_total = len(stores)
    store_status = {}
    for s in stores:
        val = s.status.value
        store_status[val] = store_status.get(val, 0) + 1

    # 개선 과제 현황
    task_result = await db.execute(select(ImprovementTask))
    tasks = list(task_result.scalars().all())
    task_status = {}
    for t in tasks:
        val = t.status.value
        task_status[val] = task_status.get(val, 0) + 1

    pending_tasks = task_status.get("미처리", 0)

    # 최근 점검 수
    inspection_count_result = await db.execute(
        select(func.count()).select_from(StoreInspection)
    )
    total_inspections = inspection_count_result.scalar()

    return {
        "prospects": {
            "total": prospect_total,
            "by_status": prospect_status,
            "conversion_rate": conversion_rate,
        },
        "stores": {
            "total": store_total,
            "by_status": store_status,
        },
        "improvement_tasks": {
            "total": len(tasks),
            "by_status": task_status,
            "pending_count": pending_tasks,
        },
        "inspections": {
            "total": total_inspections,
        },
    }


@router.get("/dev-team-metrics")
async def dev_team_metrics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점포개발팀 대시보드 (상담 전환율, 진행 현황)."""
    if user.role not in [UserRole.ADMIN, UserRole.DEV_MANAGER, UserRole.DEV_STAFF]:
        raise HTTPException(status_code=403, detail="점포개발팀 권한이 필요합니다.")

    # 가맹문의자 상태별 현황
    prospect_result = await db.execute(select(Prospect))
    prospects = list(prospect_result.scalars().all())
    prospect_status = {}
    for p in prospects:
        val = p.status.value
        prospect_status[val] = prospect_status.get(val, 0) + 1

    # 전환율
    total = len(prospects)
    contracted = prospect_status.get("성약", 0)
    conversion_rate = round((contracted / total * 100), 2) if total > 0 else 0.0

    # 상담 기록 현황
    consultation_result = await db.execute(select(Consultation))
    consultations = list(consultation_result.scalars().all())
    total_consultations = len(consultations)

    # 상담 결과별 분포
    result_dist = {}
    for c in consultations:
        val = c.result.value
        result_dist[val] = result_dist.get(val, 0) + 1

    # 진행중인 문의자 (상담 중)
    in_progress = prospect_status.get("진행중", 0)
    new_prospects = prospect_status.get("신규", 0)

    return {
        "prospects": {
            "total": total,
            "by_status": prospect_status,
            "new_count": new_prospects,
            "in_progress_count": in_progress,
            "conversion_rate": conversion_rate,
        },
        "consultations": {
            "total": total_consultations,
            "by_result": result_dist,
        },
    }


@router.get("/supervisor-metrics")
async def supervisor_metrics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """슈퍼바이저 대시보드 (점포별 건강도, 개선 과제)."""
    if user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR_MANAGER, UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="슈퍼바이저 권한이 필요합니다.")

    # 점포 현황
    store_result = await db.execute(select(Store))
    stores = list(store_result.scalars().all())
    store_total = len(stores)
    store_status = {}
    for s in stores:
        val = s.status.value
        store_status[val] = store_status.get(val, 0) + 1

    # 최근 점검 현황
    inspection_result = await db.execute(
        select(StoreInspection).order_by(StoreInspection.inspection_date.desc()).limit(20)
    )
    recent_inspections = list(inspection_result.scalars().all())

    quality_poor_count = sum(1 for i in recent_inspections if i.quality_status == QualityStatus.POOR)
    hygiene_poor_count = sum(1 for i in recent_inspections if i.hygiene_status == HygieneStatus.POOR)

    # 개선 과제 현황
    task_result = await db.execute(select(ImprovementTask))
    tasks = list(task_result.scalars().all())
    task_status = {}
    for t in tasks:
        val = t.status.value
        task_status[val] = task_status.get(val, 0) + 1

    task_category = {}
    for t in tasks:
        val = t.category.value
        task_category[val] = task_category.get(val, 0) + 1

    pending = task_status.get("미처리", 0)
    in_progress = task_status.get("진행중", 0)

    return {
        "stores": {
            "total": store_total,
            "by_status": store_status,
        },
        "inspections": {
            "recent_count": len(recent_inspections),
            "quality_poor_count": quality_poor_count,
            "hygiene_poor_count": hygiene_poor_count,
        },
        "improvement_tasks": {
            "total": len(tasks),
            "by_status": task_status,
            "by_category": task_category,
            "pending_count": pending,
            "in_progress_count": in_progress,
        },
    }

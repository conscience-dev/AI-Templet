import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.store import Store, StoreStatus
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskStatus, TaskPriority
from app.dependencies import get_current_user

router = APIRouter()


def _build_alert(
    store: Store,
    level: str,
    alert_type: str,
    message: str,
    details: str | None = None,
) -> dict:
    """경보 딕셔너리를 생성합니다."""
    return {
        "id": str(uuid.uuid4()),
        "store_id": str(store.id),
        "store_name": store.store_name,
        "level": level,
        "type": alert_type,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "details": details,
    }


async def _generate_alerts_for_store(
    store: Store,
    db: AsyncSession,
) -> list[dict]:
    """특정 점포에 대한 경보를 실시간 계산합니다."""
    alerts = []
    now = datetime.now(timezone.utc)

    # 최근 점검 기록 조회 (최신순)
    inspection_result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.store_id == store.id)
        .order_by(StoreInspection.inspection_date.desc())
        .limit(5)
    )
    inspections = list(inspection_result.scalars().all())

    # 미처리/진행중 개선 과제 조회
    task_result = await db.execute(
        select(ImprovementTask)
        .where(
            ImprovementTask.store_id == store.id,
            ImprovementTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
    )
    pending_tasks = list(task_result.scalars().all())

    # 1. 최근 점검에서 품질+위생 모두 미흡 -> 위험(critical)
    if inspections:
        latest = inspections[0]
        if (
            latest.quality_status == QualityStatus.POOR
            and latest.hygiene_status == HygieneStatus.POOR
        ):
            alerts.append(_build_alert(
                store=store,
                level="critical",
                alert_type="quality",
                message=f"최근 점검에서 품질과 위생 모두 미흡 판정",
                details=f"점검일: {latest.inspection_date.strftime('%Y-%m-%d') if hasattr(latest.inspection_date, 'strftime') else str(latest.inspection_date)[:10]}",
            ))

    # 2. 연속 2회 이상 미흡 -> 위험(critical)
    if len(inspections) >= 2:
        consecutive_quality_poor = all(
            i.quality_status == QualityStatus.POOR for i in inspections[:2]
        )
        consecutive_hygiene_poor = all(
            i.hygiene_status == HygieneStatus.POOR for i in inspections[:2]
        )
        if consecutive_quality_poor:
            alerts.append(_build_alert(
                store=store,
                level="critical",
                alert_type="consecutive_fail",
                message=f"품질 평가 연속 2회 미흡",
                details=f"최근 {len([i for i in inspections if i.quality_status == QualityStatus.POOR])}회 연속 미흡",
            ))
        if consecutive_hygiene_poor:
            alerts.append(_build_alert(
                store=store,
                level="critical",
                alert_type="consecutive_fail",
                message=f"위생 평가 연속 2회 미흡",
                details=f"최근 {len([i for i in inspections if i.hygiene_status == HygieneStatus.POOR])}회 연속 미흡",
            ))

    # 3. 미처리 과제 5건 이상 -> 경고(warning)
    pending_count = sum(1 for t in pending_tasks if t.status == TaskStatus.PENDING)
    if pending_count >= 5:
        alerts.append(_build_alert(
            store=store,
            level="warning",
            alert_type="overdue",
            message=f"미처리 개선 과제 {pending_count}건 누적",
            details=f"미처리 {pending_count}건, 진행중 {len(pending_tasks) - pending_count}건",
        ))

    # 4. 높은 우선순위 과제 기한 초과 -> 경고(warning)
    now_naive = now.replace(tzinfo=None)
    overdue_high = [
        t for t in pending_tasks
        if t.priority == TaskPriority.HIGH
        and t.due_date is not None
        and t.due_date.replace(tzinfo=None) < now_naive
    ]
    if overdue_high:
        alerts.append(_build_alert(
            store=store,
            level="warning",
            alert_type="overdue",
            message=f"높은 우선순위 과제 {len(overdue_high)}건 기한 초과",
            details=", ".join(
                t.task_description[:30] for t in overdue_high[:3]
            ),
        ))

    # 5. 30일 이상 미점검 -> 주의(info)
    if inspections:
        last_inspection_date = inspections[0].inspection_date
        if hasattr(last_inspection_date, 'tzinfo') and last_inspection_date.tzinfo is None:
            last_inspection_date = last_inspection_date.replace(tzinfo=timezone.utc)
        days_since = (now - last_inspection_date).days
        if days_since >= 30:
            alerts.append(_build_alert(
                store=store,
                level="info",
                alert_type="unvisited",
                message=f"{days_since}일간 미점검 상태",
                details=f"마지막 점검일: {inspections[0].inspection_date.strftime('%Y-%m-%d') if hasattr(inspections[0].inspection_date, 'strftime') else str(inspections[0].inspection_date)[:10]}",
            ))
    else:
        # 점검 기록 자체가 없는 경우
        alerts.append(_build_alert(
            store=store,
            level="info",
            alert_type="unvisited",
            message="점검 기록이 없습니다",
            details="아직 점검이 한 번도 진행되지 않았습니다.",
        ))

    return alerts


@router.get("/")
async def get_alerts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """전체 경보 목록을 조회합니다."""
    # 운영중인 점포만 대상
    store_result = await db.execute(
        select(Store).where(Store.status == StoreStatus.OPERATING)
    )
    stores = list(store_result.scalars().all())

    all_alerts = []
    for store in stores:
        store_alerts = await _generate_alerts_for_store(store, db)
        all_alerts.extend(store_alerts)

    # 레벨 순서: critical > warning > info
    level_order = {"critical": 0, "warning": 1, "info": 2}
    all_alerts.sort(key=lambda a: level_order.get(a["level"], 3))

    summary = {
        "critical": sum(1 for a in all_alerts if a["level"] == "critical"),
        "warning": sum(1 for a in all_alerts if a["level"] == "warning"),
        "info": sum(1 for a in all_alerts if a["level"] == "info"),
    }

    return {"alerts": all_alerts, "summary": summary}


@router.get("/store/{store_id}")
async def get_store_alerts(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 점포의 경보를 조회합니다."""
    store_result = await db.execute(
        select(Store).where(Store.id == store_id)
    )
    store = store_result.scalar_one_or_none()

    if not store:
        return {"alerts": []}

    alerts = await _generate_alerts_for_store(store, db)

    level_order = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda a: level_order.get(a["level"], 3))

    return {"alerts": alerts}

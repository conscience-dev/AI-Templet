from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole, DepartmentType
from app.models.store import Store
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskStatus, TaskCategory
from app.dependencies import get_current_user

router = APIRouter()


def _check_supervisor_dashboard_permission(user: User):
    if user.role == UserRole.ADMIN:
        return
    if user.department in [DepartmentType.EXECUTIVE, DepartmentType.SUPERVISOR]:
        return
    raise HTTPException(status_code=403, detail="슈퍼바이저 성과 대시보드 권한이 필요합니다.")


def _get_month_start():
    """이번 달 1일 00:00 (UTC) 반환."""
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _compute_health_score(inspections: list[StoreInspection]) -> float:
    """최근 점검 기록 기반 건강도 점수 (0~100)."""
    if not inspections:
        return 0.0

    quality_scores = [
        100.0 if i.quality_status == QualityStatus.GOOD else 30.0
        for i in inspections
    ]
    quality_avg = sum(quality_scores) / len(quality_scores)

    hygiene_scores = [
        100.0 if i.hygiene_status == HygieneStatus.GOOD else 30.0
        for i in inspections
    ]
    hygiene_avg = sum(hygiene_scores) / len(hygiene_scores)

    # sales_note는 텍스트이므로 기본 50점 사용
    sales_avg = 50.0

    return round(quality_avg * 0.35 + hygiene_avg * 0.35 + sales_avg * 0.30, 1)


@router.get("/")
async def list_supervisors(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """슈퍼바이저 목록 (department=SUPERVISOR 또는 SUPERVISOR_MANAGER 역할)."""
    _check_supervisor_dashboard_permission(user)

    month_start = _get_month_start()

    # 슈퍼바이저 역할 사용자 조회
    result = await db.execute(
        select(User).where(
            User.department == DepartmentType.SUPERVISOR,
            User.is_active == True,
        )
    )
    supervisors = list(result.scalars().all())

    items = []
    for sv in supervisors:
        # 담당 점포 수
        store_count_result = await db.execute(
            select(func.count()).select_from(Store).where(Store.supervisor_id == sv.id)
        )
        store_count = store_count_result.scalar()

        # 이번 달 점검 수
        inspection_count_result = await db.execute(
            select(func.count()).select_from(StoreInspection).where(
                StoreInspection.supervisor_id == sv.id,
                StoreInspection.inspection_date >= month_start,
            )
        )
        inspection_count = inspection_count_result.scalar()

        items.append({
            "id": str(sv.id),
            "name": sv.name or sv.email,
            "role": sv.role.value if sv.role else None,
            "store_count": store_count,
            "inspection_count_this_month": inspection_count,
        })

    return items


@router.get("/performance/")
async def supervisor_performance(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """전체 슈퍼바이저 성과 비교."""
    _check_supervisor_dashboard_permission(user)

    month_start = _get_month_start()

    # 슈퍼바이저 목록
    result = await db.execute(
        select(User).where(
            User.department == DepartmentType.SUPERVISOR,
            User.is_active == True,
        )
    )
    supervisors = list(result.scalars().all())

    performance_list = []
    total_uninspected = 0

    for sv in supervisors:
        # 담당 점포 목록
        store_result = await db.execute(
            select(Store).where(Store.supervisor_id == sv.id)
        )
        stores = list(store_result.scalars().all())
        store_count = len(stores)
        store_ids = [s.id for s in stores]

        # 이번 달 점검 수
        inspection_count_result = await db.execute(
            select(func.count()).select_from(StoreInspection).where(
                StoreInspection.supervisor_id == sv.id,
                StoreInspection.inspection_date >= month_start,
            )
        )
        inspections_this_month = inspection_count_result.scalar()

        # 점검률
        inspection_rate = round(
            (inspections_this_month / store_count * 100), 1
        ) if store_count > 0 else 0.0

        # 미점검 점포 수 (이번달에 점검 안 한 점포)
        if store_ids:
            inspected_store_result = await db.execute(
                select(StoreInspection.store_id).where(
                    StoreInspection.supervisor_id == sv.id,
                    StoreInspection.inspection_date >= month_start,
                    StoreInspection.store_id.in_(store_ids),
                ).distinct()
            )
            inspected_store_ids = set(inspected_store_result.scalars().all())
            uninspected = store_count - len(inspected_store_ids)
        else:
            uninspected = 0
        total_uninspected += uninspected

        # 담당 점포 과제 완료율
        if store_ids:
            total_tasks_result = await db.execute(
                select(func.count()).select_from(ImprovementTask).where(
                    ImprovementTask.store_id.in_(store_ids)
                )
            )
            total_tasks = total_tasks_result.scalar()

            completed_tasks_result = await db.execute(
                select(func.count()).select_from(ImprovementTask).where(
                    ImprovementTask.store_id.in_(store_ids),
                    ImprovementTask.status == TaskStatus.COMPLETED,
                )
            )
            completed_tasks = completed_tasks_result.scalar()

            task_completion_rate = round(
                (completed_tasks / total_tasks * 100), 1
            ) if total_tasks > 0 else 0.0

            # 미처리(PENDING) + 지연 과제
            overdue_result = await db.execute(
                select(func.count()).select_from(ImprovementTask).where(
                    ImprovementTask.store_id.in_(store_ids),
                    ImprovementTask.status == TaskStatus.PENDING,
                )
            )
            overdue_tasks = overdue_result.scalar()
        else:
            task_completion_rate = 0.0
            overdue_tasks = 0

        # 담당 점포 평균 건강도
        health_scores = []
        for store in stores:
            insp_result = await db.execute(
                select(StoreInspection)
                .where(StoreInspection.store_id == store.id)
                .order_by(StoreInspection.inspection_date.desc())
                .limit(5)
            )
            store_inspections = list(insp_result.scalars().all())
            score = _compute_health_score(store_inspections)
            if score > 0:
                health_scores.append(score)

        avg_health_score = round(
            sum(health_scores) / len(health_scores), 1
        ) if health_scores else 0.0

        performance_list.append({
            "id": str(sv.id),
            "name": sv.name or sv.email,
            "store_count": store_count,
            "inspections_this_month": inspections_this_month,
            "inspection_rate": inspection_rate,
            "task_completion_rate": task_completion_rate,
            "avg_health_score": avg_health_score,
            "overdue_tasks": overdue_tasks,
        })

    # 전체 요약
    total_supervisors = len(supervisors)
    avg_inspection_rate = round(
        sum(p["inspection_rate"] for p in performance_list) / total_supervisors, 1
    ) if total_supervisors > 0 else 0.0
    avg_task_completion = round(
        sum(p["task_completion_rate"] for p in performance_list) / total_supervisors, 1
    ) if total_supervisors > 0 else 0.0

    return {
        "summary": {
            "total_supervisors": total_supervisors,
            "avg_inspection_rate": avg_inspection_rate,
            "avg_task_completion_rate": avg_task_completion,
            "total_uninspected_stores": total_uninspected,
        },
        "supervisors": performance_list,
    }


@router.get("/{supervisor_id}/detail/")
async def supervisor_detail(
    supervisor_id: str = Path(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 슈퍼바이저 상세 성과."""
    _check_supervisor_dashboard_permission(user)

    # 슈퍼바이저 조회
    result = await db.execute(select(User).where(User.id == supervisor_id))
    supervisor = result.scalar_one_or_none()
    if not supervisor:
        raise HTTPException(status_code=404, detail="슈퍼바이저를 찾을 수 없습니다.")

    month_start = _get_month_start()

    # 담당 점포 목록 + 각 점포별 정보
    store_result = await db.execute(
        select(Store).where(Store.supervisor_id == supervisor_id)
    )
    stores = list(store_result.scalars().all())
    store_ids = [s.id for s in stores]

    stores_data = []
    for store in stores:
        # 최근 점검일
        last_insp_result = await db.execute(
            select(StoreInspection)
            .where(StoreInspection.store_id == store.id)
            .order_by(StoreInspection.inspection_date.desc())
            .limit(5)
        )
        store_inspections = list(last_insp_result.scalars().all())

        last_inspection_date = None
        if store_inspections:
            last_inspection_date = store_inspections[0].inspection_date.isoformat() if store_inspections[0].inspection_date else None

        # 건강도
        health_score = _compute_health_score(store_inspections)

        # 미처리 과제 수
        pending_result = await db.execute(
            select(func.count()).select_from(ImprovementTask).where(
                ImprovementTask.store_id == store.id,
                ImprovementTask.status == TaskStatus.PENDING,
            )
        )
        pending_tasks = pending_result.scalar()

        stores_data.append({
            "id": str(store.id),
            "store_name": store.store_name,
            "region": store.region,
            "status": store.status.value,
            "last_inspection_date": last_inspection_date,
            "health_score": health_score,
            "pending_tasks": pending_tasks,
        })

    # 최근 6개월 월별 점검 수
    now = datetime.now(timezone.utc)
    monthly_inspections = []
    for i in range(5, -1, -1):
        # i개월 전의 연/월 계산 (stdlib만 사용)
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        m_start = datetime(year, month, 1, tzinfo=timezone.utc)
        # 다음 달 1일 계산
        next_month = month + 1
        next_year = year
        if next_month > 12:
            next_month = 1
            next_year += 1
        m_end = datetime(next_year, next_month, 1, tzinfo=timezone.utc)

        count_result = await db.execute(
            select(func.count()).select_from(StoreInspection).where(
                StoreInspection.supervisor_id == supervisor_id,
                StoreInspection.inspection_date >= m_start,
                StoreInspection.inspection_date < m_end,
            )
        )
        count = count_result.scalar()
        monthly_inspections.append({
            "month": m_start.strftime("%Y-%m"),
            "count": count,
        })

    # 과제 통계
    if store_ids:
        # 전체/완료/미처리/진행중
        task_stats = {"total": 0, "completed": 0, "pending": 0, "in_progress": 0}
        for status_enum in TaskStatus:
            count_result = await db.execute(
                select(func.count()).select_from(ImprovementTask).where(
                    ImprovementTask.store_id.in_(store_ids),
                    ImprovementTask.status == status_enum,
                )
            )
            count = count_result.scalar()
            task_stats["total"] += count
            if status_enum == TaskStatus.COMPLETED:
                task_stats["completed"] = count
            elif status_enum == TaskStatus.PENDING:
                task_stats["pending"] = count
            elif status_enum == TaskStatus.IN_PROGRESS:
                task_stats["in_progress"] = count

        # 카테고리별 과제 통계
        category_stats = []
        for cat in TaskCategory:
            total_result = await db.execute(
                select(func.count()).select_from(ImprovementTask).where(
                    ImprovementTask.store_id.in_(store_ids),
                    ImprovementTask.category == cat,
                )
            )
            cat_total = total_result.scalar()

            completed_result = await db.execute(
                select(func.count()).select_from(ImprovementTask).where(
                    ImprovementTask.store_id.in_(store_ids),
                    ImprovementTask.category == cat,
                    ImprovementTask.status == TaskStatus.COMPLETED,
                )
            )
            cat_completed = completed_result.scalar()

            if cat_total > 0:
                category_stats.append({
                    "category": cat.value,
                    "total": cat_total,
                    "completed": cat_completed,
                })
    else:
        task_stats = {"total": 0, "completed": 0, "pending": 0, "in_progress": 0}
        category_stats = []

    return {
        "supervisor": {
            "id": str(supervisor.id),
            "name": supervisor.name or supervisor.email,
            "role": supervisor.role.value if supervisor.role else None,
        },
        "stores": stores_data,
        "monthly_inspections": monthly_inspections,
        "task_stats": task_stats,
        "category_stats": category_stats,
    }

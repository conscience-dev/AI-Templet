from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.store import Store, StoreStatus
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskStatus
from app.schemas.store import StoreCreateIn, StoreUpdateIn, StoreOut
from app.schemas.store_inspection import StoreInspectionCreateIn, StoreInspectionUpdateIn, StoreInspectionOut
from app.schemas.improvement_task import ImprovementTaskOut
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()

def _check_store_permission(user: User):
    if user.role == UserRole.ADMIN:
        return
    from app.models.user import DepartmentType
    if user.department not in [DepartmentType.SUPERVISOR, DepartmentType.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="점포 관련 권한이 필요합니다.")


def _serialize_store(store: Store) -> StoreOut:
    return StoreOut(
        id=str(store.id),
        store_name=store.store_name,
        region=store.region,
        address=store.address,
        supervisor_id=str(store.supervisor_id) if store.supervisor_id else None,
        supervisor_name=(store.supervisor.name or store.supervisor.email) if store.supervisor else None,
        status=store.status.value,
        created_at=store.created_at.isoformat(),
        updated_at=store.updated_at.isoformat(),
    )


@router.post("/", response_model=StoreOut)
async def create_store(
    data: StoreCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_store_permission(user)

    # 점포명 중복 확인
    result = await db.execute(select(Store).where(Store.store_name == data.store_name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 등록된 점포명입니다.")

    status = StoreStatus.OPERATING
    if data.status:
        for s in StoreStatus:
            if s.value == data.status:
                status = s
                break

    store = Store(
        store_name=data.store_name,
        region=data.region,
        address=data.address,
        supervisor_id=data.supervisor_id if data.supervisor_id else None,
        status=status,
    )
    db.add(store)
    await db.commit()
    await db.refresh(store)

    # supervisor 로드
    result = await db.execute(
        select(Store).where(Store.id == store.id).options(selectinload(Store.supervisor))
    )
    store = result.scalar_one()

    return _serialize_store(store)


@router.get("/", response_model=PaginatedResponse[StoreOut])
async def list_stores(
    page: int = Query(1, ge=1),
    region: str = Query("", description="지역 필터"),
    status: str = Query("", description="상태 필터"),
    supervisor_id: str = Query("", description="슈퍼바이저 필터"),
    search: str = Query("", description="점포명 검색"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_store_permission(user)

    query = (
        select(Store)
        .options(selectinload(Store.supervisor))
        .order_by(Store.created_at.desc())
    )

    if region:
        query = query.where(Store.region.contains(region))
    if status:
        query = query.where(Store.status == status)
    if supervisor_id:
        query = query.where(Store.supervisor_id == supervisor_id)
    if search:
        query = query.where(Store.store_name.contains(search))

    result = await db.execute(query)
    stores = list(result.scalars().all())
    serialized = [_serialize_store(s) for s in stores]
    return paginate(serialized, page)


@router.get("/{store_id}", response_model=StoreOut)
async def get_store(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_store_permission(user)

    result = await db.execute(
        select(Store).where(Store.id == store_id).options(selectinload(Store.supervisor))
    )
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    return _serialize_store(store)


@router.patch("/{store_id}", response_model=StoreOut)
async def update_store(
    store_id: str,
    data: StoreUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_store_permission(user)

    result = await db.execute(
        select(Store).where(Store.id == store_id).options(selectinload(Store.supervisor))
    )
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    if data.store_name is not None:
        existing = await db.execute(
            select(Store).where(Store.store_name == data.store_name, Store.id != store.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="이미 등록된 점포명입니다.")
        store.store_name = data.store_name
    if data.region is not None:
        store.region = data.region
    if data.address is not None:
        store.address = data.address
    if data.supervisor_id is not None:
        store.supervisor_id = data.supervisor_id if data.supervisor_id else None
    if data.status is not None:
        for s in StoreStatus:
            if s.value == data.status:
                store.status = s
                break

    await db.commit()
    await db.refresh(store)

    # supervisor 재로드
    result = await db.execute(
        select(Store).where(Store.id == store.id).options(selectinload(Store.supervisor))
    )
    store = result.scalar_one()

    return _serialize_store(store)


@router.get("/{store_id}/inspections", response_model=list[StoreInspectionOut])
async def get_store_inspections(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 점포의 점검 이력 조회."""
    _check_store_permission(user)

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.store_id == store_id)
        .options(selectinload(StoreInspection.supervisor))
        .order_by(StoreInspection.inspection_date.desc())
    )
    inspections = list(result.scalars().all())

    return [
        StoreInspectionOut(
            id=str(i.id),
            store_id=str(i.store_id),
            store_name=store.store_name,
            supervisor_id=str(i.supervisor_id),
            supervisor_name=(i.supervisor.name or i.supervisor.email) if i.supervisor else None,
            inspection_date=i.inspection_date.isoformat() if i.inspection_date else "",
            quality_status=i.quality_status.value,
            quality_notes=i.quality_notes,
            hygiene_status=i.hygiene_status.value,
            hygiene_notes=i.hygiene_notes,
            sales_note=i.sales_note,
            owner_feedback=i.owner_feedback,
            created_at=i.created_at.isoformat(),
            updated_at=i.updated_at.isoformat(),
        )
        for i in inspections
    ]


@router.post("/{store_id}/inspections", response_model=StoreInspectionOut)
async def create_inspection(
    store_id: str,
    data: StoreInspectionCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 점포에 대한 점검 기록 생성."""
    _check_store_permission(user)

    # 점포 확인
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    # enum 변환
    quality_status = None
    for qs in QualityStatus:
        if qs.value == data.quality_status:
            quality_status = qs
            break
    if not quality_status:
        raise HTTPException(status_code=400, detail="유효하지 않은 품질 상태입니다.")

    hygiene_status = None
    for hs in HygieneStatus:
        if hs.value == data.hygiene_status:
            hygiene_status = hs
            break
    if not hygiene_status:
        raise HTTPException(status_code=400, detail="유효하지 않은 위생 상태입니다.")

    try:
        inspection_date = datetime.fromisoformat(data.inspection_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 점검일시 형식입니다.")

    inspection = StoreInspection(
        store_id=store.id,
        supervisor_id=user.id,
        inspection_date=inspection_date,
        quality_status=quality_status,
        quality_notes=data.quality_notes,
        hygiene_status=hygiene_status,
        hygiene_notes=data.hygiene_notes,
        sales_note=data.sales_note,
        owner_feedback=data.owner_feedback,
    )
    db.add(inspection)
    await db.commit()
    await db.refresh(inspection)

    return StoreInspectionOut(
        id=str(inspection.id),
        store_id=str(inspection.store_id),
        store_name=store.store_name,
        supervisor_id=str(inspection.supervisor_id),
        supervisor_name=user.name or user.email,
        inspection_date=inspection.inspection_date.isoformat() if inspection.inspection_date else "",
        quality_status=inspection.quality_status.value,
        quality_notes=inspection.quality_notes,
        hygiene_status=inspection.hygiene_status.value,
        hygiene_notes=inspection.hygiene_notes,
        sales_note=inspection.sales_note,
        owner_feedback=inspection.owner_feedback,
        created_at=inspection.created_at.isoformat(),
        updated_at=inspection.updated_at.isoformat(),
    )


@router.patch("/{store_id}/inspections/{inspection_id}", response_model=StoreInspectionOut)
async def update_inspection(
    store_id: str,
    inspection_id: str,
    data: StoreInspectionUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점검 기록 수정."""
    _check_store_permission(user)

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection_id, StoreInspection.store_id == store_id)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    if data.quality_status is not None:
        for qs in QualityStatus:
            if qs.value == data.quality_status:
                inspection.quality_status = qs
                break
    if data.quality_notes is not None:
        inspection.quality_notes = data.quality_notes
    if data.hygiene_status is not None:
        for hs in HygieneStatus:
            if hs.value == data.hygiene_status:
                inspection.hygiene_status = hs
                break
    if data.hygiene_notes is not None:
        inspection.hygiene_notes = data.hygiene_notes
    if data.sales_note is not None:
        inspection.sales_note = data.sales_note
    if data.owner_feedback is not None:
        inspection.owner_feedback = data.owner_feedback

    await db.commit()
    await db.refresh(inspection)

    # Reload relationships
    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection.id)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
    )
    inspection = result.scalar_one()

    return StoreInspectionOut(
        id=str(inspection.id),
        store_id=str(inspection.store_id),
        store_name=inspection.store.store_name if inspection.store else None,
        supervisor_id=str(inspection.supervisor_id),
        supervisor_name=(inspection.supervisor.name or inspection.supervisor.email) if inspection.supervisor else None,
        inspection_date=inspection.inspection_date.isoformat() if inspection.inspection_date else "",
        quality_status=inspection.quality_status.value,
        quality_notes=inspection.quality_notes,
        hygiene_status=inspection.hygiene_status.value,
        hygiene_notes=inspection.hygiene_notes,
        sales_note=inspection.sales_note,
        owner_feedback=inspection.owner_feedback,
        created_at=inspection.created_at.isoformat(),
        updated_at=inspection.updated_at.isoformat(),
    )


@router.delete("/{store_id}/inspections/{inspection_id}")
async def delete_inspection(
    store_id: str,
    inspection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점검 기록 삭제."""
    _check_store_permission(user)

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection_id, StoreInspection.store_id == store_id)
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    await db.delete(inspection)
    await db.commit()

    return {"status": "success", "message": "점검 기록이 삭제되었습니다."}


@router.get("/{store_id}/improvement-tasks", response_model=list[ImprovementTaskOut])
async def get_store_improvement_tasks(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 점포의 개선 과제 조회."""
    _check_store_permission(user)

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.store_id == store_id)
        .order_by(ImprovementTask.created_at.desc())
    )
    tasks = list(result.scalars().all())

    return [
        ImprovementTaskOut(
            id=str(t.id),
            store_id=str(t.store_id),
            store_name=store.store_name,
            inspection_id=str(t.inspection_id) if t.inspection_id else None,
            category=t.category.value,
            task_description=t.task_description,
            priority=t.priority.value,
            status=t.status.value,
            due_date=t.due_date.isoformat() if t.due_date else None,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat(),
        )
        for t in tasks
    ]


@router.get("/{store_id}/health-score")
async def get_store_health_score(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점포 건강도 점수를 계산합니다."""
    _check_store_permission(user)

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    # 최근 점검 결과 조회 (최근 10건)
    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.store_id == store_id)
        .order_by(StoreInspection.inspection_date.desc())
        .limit(10)
    )
    inspections = list(result.scalars().all())

    # 개선과제 통계
    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.store_id == store_id)
    )
    all_tasks = list(result.scalars().all())

    total_tasks = len(all_tasks)
    completed_tasks = sum(1 for t in all_tasks if t.status == TaskStatus.COMPLETED)
    pending_tasks = sum(1 for t in all_tasks if t.status == TaskStatus.PENDING)
    in_progress_tasks = sum(1 for t in all_tasks if t.status == TaskStatus.IN_PROGRESS)
    task_completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 100)

    # 품질/위생 점수 계산 (최근 5건 기준)
    recent_5 = inspections[:5]
    if recent_5:
        quality_good = sum(1 for i in recent_5 if i.quality_status == QualityStatus.GOOD)
        hygiene_good = sum(1 for i in recent_5 if i.hygiene_status == HygieneStatus.GOOD)
        quality_score = round(quality_good / len(recent_5) * 100)
        hygiene_score = round(hygiene_good / len(recent_5) * 100)
    else:
        quality_score = 0
        hygiene_score = 0

    # 종합 점수 (품질 30%, 위생 30%, 과제완료율 40%)
    overall_score = round(quality_score * 0.3 + hygiene_score * 0.3 + task_completion_rate * 0.4)

    # 추이 판단 (최근 3건 vs 이전 3건)
    trend = "stable"
    if len(inspections) >= 4:
        recent_3 = inspections[:3]
        prev_3 = inspections[3:6]
        if prev_3:
            recent_good = sum(
                (1 if i.quality_status == QualityStatus.GOOD else 0)
                + (1 if i.hygiene_status == HygieneStatus.GOOD else 0)
                for i in recent_3
            )
            prev_good = sum(
                (1 if i.quality_status == QualityStatus.GOOD else 0)
                + (1 if i.hygiene_status == HygieneStatus.GOOD else 0)
                for i in prev_3
            )
            recent_avg = recent_good / len(recent_3)
            prev_avg = prev_good / len(prev_3)
            if recent_avg > prev_avg + 0.3:
                trend = "improving"
            elif recent_avg < prev_avg - 0.3:
                trend = "declining"

    # 최근 점검 이력 (차트용)
    recent_inspections_data = [
        {
            "date": i.inspection_date.isoformat() if i.inspection_date else "",
            "quality": 1 if i.quality_status == QualityStatus.GOOD else 0,
            "hygiene": 1 if i.hygiene_status == HygieneStatus.GOOD else 0,
        }
        for i in reversed(inspections[:10])
    ]

    return {
        "overall_score": overall_score,
        "quality_score": quality_score,
        "hygiene_score": hygiene_score,
        "task_completion_rate": task_completion_rate,
        "trend": trend,
        "recent_inspections": recent_inspections_data,
        "task_stats": {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": pending_tasks,
            "in_progress": in_progress_tasks,
        },
    }


@router.get("/{store_id}/improvement-history")
async def get_store_improvement_history(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점포의 개선 이력 타임라인을 조회합니다."""
    _check_store_permission(user)

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    # 점검 기록 조회 (과제 포함)
    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.store_id == store_id)
        .order_by(StoreInspection.inspection_date.desc())
    )
    inspections = list(result.scalars().all())

    timeline = []
    for insp in inspections:
        # 해당 점검에 연결된 과제 조회
        result = await db.execute(
            select(ImprovementTask)
            .where(ImprovementTask.inspection_id == insp.id)
            .order_by(ImprovementTask.created_at.asc())
        )
        tasks = list(result.scalars().all())

        timeline.append({
            "inspection_id": str(insp.id),
            "inspection_date": insp.inspection_date.isoformat() if insp.inspection_date else "",
            "quality_status": insp.quality_status.value,
            "hygiene_status": insp.hygiene_status.value,
            "tasks": [
                {
                    "id": str(t.id),
                    "category": t.category.value,
                    "description": t.task_description,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "created_at": t.created_at.isoformat(),
                    "completed_at": t.updated_at.isoformat() if t.status == TaskStatus.COMPLETED else None,
                }
                for t in tasks
            ],
        })

    return {"timeline": timeline}


@router.get("/{store_id}/previous-issues")
async def get_store_previous_issues(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """이전 점검에서 미완료된 지적사항을 조회합니다."""
    _check_store_permission(user)

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    # 미처리/진행중 과제 조회 (점검 정보 포함)
    result = await db.execute(
        select(ImprovementTask)
        .where(
            ImprovementTask.store_id == store_id,
            ImprovementTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
        .options(selectinload(ImprovementTask.inspection))
        .order_by(ImprovementTask.created_at.asc())
    )
    tasks = list(result.scalars().all())

    now = datetime.now(timezone.utc)
    unresolved = []
    for t in tasks:
        inspection_date = ""
        days_overdue = 0
        if t.inspection:
            inspection_date = t.inspection.inspection_date.isoformat() if t.inspection.inspection_date else ""
            if t.inspection.inspection_date:
                insp_dt = t.inspection.inspection_date
                # naive datetime 처리
                if insp_dt.tzinfo is None:
                    delta = datetime.now() - insp_dt
                else:
                    delta = now - insp_dt
                days_overdue = max(0, delta.days)

        unresolved.append({
            "task_id": str(t.id),
            "category": t.category.value,
            "description": t.task_description,
            "priority": t.priority.value,
            "status": t.status.value,
            "inspection_date": inspection_date,
            "days_overdue": days_overdue,
        })

    return {"unresolved": unresolved}

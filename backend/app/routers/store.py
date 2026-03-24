from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.store import Store, StoreStatus
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskStatus
from app.schemas.store import StoreCreateIn, StoreUpdateIn, StoreOut, StoreHealthScoreOut
from app.schemas.store_inspection import StoreInspectionOut
from app.schemas.improvement_task import ImprovementTaskOut
from app.schemas.common import SuccessOut
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()

STORE_ROLES = [UserRole.ADMIN, UserRole.SUPERVISOR_MANAGER, UserRole.SUPERVISOR, UserRole.EXECUTIVE]


def _check_store_permission(user: User):
    if user.role not in STORE_ROLES:
        raise HTTPException(status_code=403, detail="점포 관련 권한이 필요합니다.")


def _serialize_store(store: Store) -> StoreOut:
    return StoreOut(
        id=str(store.id),
        store_name=store.store_name,
        region=store.region,
        address=store.address,
        supervisor_id=str(store.supervisor_id) if store.supervisor_id else None,
        supervisor_name=(store.supervisor.name or store.supervisor.username) if store.supervisor else None,
        store_size=store.store_size,
        opening_date=store.opening_date.isoformat() if store.opening_date else None,
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

    opening_date = None
    if data.opening_date:
        try:
            opening_date = datetime.fromisoformat(data.opening_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 개점일시 형식입니다.")

    store = Store(
        store_name=data.store_name,
        region=data.region,
        address=data.address,
        supervisor_id=data.supervisor_id if data.supervisor_id else None,
        store_size=data.store_size,
        opening_date=opening_date,
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
    if data.store_size is not None:
        store.store_size = data.store_size
    if data.opening_date is not None:
        try:
            store.opening_date = datetime.fromisoformat(data.opening_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 개점일시 형식입니다.")
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


@router.delete("/{store_id}", response_model=SuccessOut)
async def delete_store(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_store_permission(user)

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    await db.delete(store)
    await db.commit()

    return {"detail": "점포가 삭제되었습니다."}


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
            supervisor_name=(i.supervisor.name or i.supervisor.username) if i.supervisor else None,
            inspection_date=i.inspection_date.isoformat() if i.inspection_date else "",
            quality_status=i.quality_status.value,
            quality_notes=i.quality_notes,
            hygiene_status=i.hygiene_status.value,
            hygiene_notes=i.hygiene_notes,
            sales_amount=i.sales_amount,
            sales_yoy_change=i.sales_yoy_change,
            sales_mom_change=i.sales_mom_change,
            staff_count=i.staff_count,
            market_change=i.market_change,
            owner_feedback=i.owner_feedback,
            improvement_items=i.improvement_items,
            created_at=i.created_at.isoformat(),
            updated_at=i.updated_at.isoformat(),
        )
        for i in inspections
    ]


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
            completed_date=t.completed_date.isoformat() if t.completed_date else None,
            completion_notes=t.completion_notes,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat(),
        )
        for t in tasks
    ]


@router.get("/{store_id}/health-score", response_model=StoreHealthScoreOut)
async def get_store_health_score(
    store_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점포 건강도 점수 (품질, 위생, 매출 종합)."""
    if user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="점포를 찾을 수 없습니다.")

    # 최근 5회 점검 기록 기반 점수 계산
    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.store_id == store_id)
        .order_by(StoreInspection.inspection_date.desc())
        .limit(5)
    )
    inspections = list(result.scalars().all())

    if not inspections:
        return StoreHealthScoreOut(
            store_id=str(store.id),
            store_name=store.store_name,
            quality_score=0.0,
            hygiene_score=0.0,
            sales_score=0.0,
            overall_score=0.0,
            pending_tasks_count=0,
            last_inspection_date=None,
        )

    # 품질 점수: 준수=100, 미흡=30
    quality_scores = [100.0 if i.quality_status == QualityStatus.COMPLIANT else 30.0 for i in inspections]
    quality_avg = sum(quality_scores) / len(quality_scores)

    # 위생 점수: 양호=100, 미흡=30
    hygiene_scores = [100.0 if i.hygiene_status == HygieneStatus.GOOD else 30.0 for i in inspections]
    hygiene_avg = sum(hygiene_scores) / len(hygiene_scores)

    # 매출 점수: 전월 대비 변화율 기반 (증가=80+, 유지=60, 감소=40-)
    sales_scores = []
    for i in inspections:
        if i.sales_mom_change is not None:
            if i.sales_mom_change > 5:
                sales_scores.append(90.0)
            elif i.sales_mom_change > 0:
                sales_scores.append(70.0)
            elif i.sales_mom_change > -5:
                sales_scores.append(50.0)
            else:
                sales_scores.append(30.0)
    sales_avg = sum(sales_scores) / len(sales_scores) if sales_scores else 50.0

    overall = (quality_avg * 0.35 + hygiene_avg * 0.35 + sales_avg * 0.30)

    # 미처리 개선 과제 수
    pending_result = await db.execute(
        select(func.count()).select_from(ImprovementTask).where(
            ImprovementTask.store_id == store_id,
            ImprovementTask.status == TaskStatus.PENDING,
        )
    )
    pending_count = pending_result.scalar()

    return StoreHealthScoreOut(
        store_id=str(store.id),
        store_name=store.store_name,
        quality_score=round(quality_avg, 1),
        hygiene_score=round(hygiene_avg, 1),
        sales_score=round(sales_avg, 1),
        overall_score=round(overall, 1),
        pending_tasks_count=pending_count,
        last_inspection_date=inspections[0].inspection_date.isoformat() if inspections[0].inspection_date else None,
    )

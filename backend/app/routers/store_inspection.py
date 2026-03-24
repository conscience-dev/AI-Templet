from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.store import Store
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskCategory, TaskPriority, TaskStatus
from app.schemas.store_inspection import StoreInspectionCreateIn, StoreInspectionUpdateIn, StoreInspectionOut
from app.schemas.improvement_task import ImprovementTaskOut
from app.schemas.common import SuccessOut
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()

SV_ROLES = [UserRole.ADMIN, UserRole.SUPERVISOR_MANAGER, UserRole.SUPERVISOR]


def _check_sv_permission(user: User):
    if user.role not in SV_ROLES:
        raise HTTPException(status_code=403, detail="슈퍼바이저 권한이 필요합니다.")


def _serialize_inspection(i: StoreInspection, store_name: str = None, supervisor_name: str = None) -> StoreInspectionOut:
    return StoreInspectionOut(
        id=str(i.id),
        store_id=str(i.store_id),
        store_name=store_name,
        supervisor_id=str(i.supervisor_id),
        supervisor_name=supervisor_name,
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


@router.post("/", response_model=StoreInspectionOut)
async def create_inspection(
    data: StoreInspectionCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_sv_permission(user)

    # 점포 확인
    result = await db.execute(select(Store).where(Store.id == data.store_id))
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
        sales_amount=data.sales_amount,
        sales_yoy_change=data.sales_yoy_change,
        sales_mom_change=data.sales_mom_change,
        staff_count=data.staff_count,
        market_change=data.market_change,
        owner_feedback=data.owner_feedback,
        improvement_items=data.improvement_items,
    )
    db.add(inspection)
    await db.commit()
    await db.refresh(inspection)

    return _serialize_inspection(
        inspection,
        store_name=store.store_name,
        supervisor_name=user.name or user.username,
    )


@router.get("/", response_model=PaginatedResponse[StoreInspectionOut])
async def list_inspections(
    page: int = Query(1, ge=1),
    store_id: str = Query("", description="점포 필터"),
    date_from: str = Query("", description="시작일 (ISO format)"),
    date_to: str = Query("", description="종료일 (ISO format)"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_sv_permission(user)

    query = (
        select(StoreInspection)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
        .order_by(StoreInspection.inspection_date.desc())
    )

    if store_id:
        query = query.where(StoreInspection.store_id == store_id)
    if date_from:
        try:
            query = query.where(StoreInspection.inspection_date >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.where(StoreInspection.inspection_date <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    result = await db.execute(query)
    inspections = list(result.scalars().all())

    serialized = [
        _serialize_inspection(
            i,
            store_name=i.store.store_name if i.store else None,
            supervisor_name=(i.supervisor.name or i.supervisor.username) if i.supervisor else None,
        )
        for i in inspections
    ]
    return paginate(serialized, page)


@router.get("/overdue-tasks", response_model=list[ImprovementTaskOut])
async def get_overdue_tasks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """미처리 개선 과제 목록."""
    if user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(ImprovementTask)
        .options(selectinload(ImprovementTask.store))
        .where(
            ImprovementTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            ImprovementTask.due_date < now,
        )
        .order_by(ImprovementTask.due_date.asc())
    )
    tasks = list(result.scalars().all())

    return [
        ImprovementTaskOut(
            id=str(t.id),
            store_id=str(t.store_id),
            store_name=t.store.store_name if t.store else None,
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


@router.get("/{inspection_id}", response_model=StoreInspectionOut)
async def get_inspection(
    inspection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_sv_permission(user)

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection_id)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
    )
    inspection = result.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    return _serialize_inspection(
        inspection,
        store_name=inspection.store.store_name if inspection.store else None,
        supervisor_name=(inspection.supervisor.name or inspection.supervisor.username) if inspection.supervisor else None,
    )


@router.patch("/{inspection_id}", response_model=StoreInspectionOut)
async def update_inspection(
    inspection_id: str,
    data: StoreInspectionUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_sv_permission(user)

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection_id)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
    )
    inspection = result.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    if data.inspection_date is not None:
        try:
            inspection.inspection_date = datetime.fromisoformat(data.inspection_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 점검일시 형식입니다.")
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
    if data.sales_amount is not None:
        inspection.sales_amount = data.sales_amount
    if data.sales_yoy_change is not None:
        inspection.sales_yoy_change = data.sales_yoy_change
    if data.sales_mom_change is not None:
        inspection.sales_mom_change = data.sales_mom_change
    if data.staff_count is not None:
        inspection.staff_count = data.staff_count
    if data.market_change is not None:
        inspection.market_change = data.market_change
    if data.owner_feedback is not None:
        inspection.owner_feedback = data.owner_feedback
    if data.improvement_items is not None:
        inspection.improvement_items = data.improvement_items

    await db.commit()
    await db.refresh(inspection)

    return _serialize_inspection(
        inspection,
        store_name=inspection.store.store_name if inspection.store else None,
        supervisor_name=(inspection.supervisor.name or inspection.supervisor.username) if inspection.supervisor else None,
    )


@router.delete("/{inspection_id}", response_model=SuccessOut)
async def delete_inspection(
    inspection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_sv_permission(user)

    result = await db.execute(select(StoreInspection).where(StoreInspection.id == inspection_id))
    inspection = result.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    await db.delete(inspection)
    await db.commit()

    return {"detail": "점검 기록이 삭제되었습니다."}


@router.post("/{inspection_id}/improvement-tasks-auto-create")
async def auto_create_improvement_tasks(
    inspection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점검 결과로부터 개선 과제 자동 생성."""
    if user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR_MANAGER]:
        raise HTTPException(status_code=403, detail="슈퍼바이저 팀장 이상 권한이 필요합니다.")

    result = await db.execute(
        select(StoreInspection).where(StoreInspection.id == inspection_id)
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    created_tasks = []

    # 품질 미흡이면 품질 개선 과제 생성
    if inspection.quality_status == QualityStatus.POOR:
        task = ImprovementTask(
            store_id=inspection.store_id,
            inspection_id=inspection.id,
            category=TaskCategory.QUALITY,
            task_description=f"품질 점검 미흡 - {inspection.quality_notes or '상세 내용 확인 필요'}",
            priority=TaskPriority.HIGH,
            status=TaskStatus.PENDING,
        )
        db.add(task)
        created_tasks.append("품질")

    # 위생 미흡이면 위생 개선 과제 생성
    if inspection.hygiene_status == HygieneStatus.POOR:
        task = ImprovementTask(
            store_id=inspection.store_id,
            inspection_id=inspection.id,
            category=TaskCategory.HYGIENE,
            task_description=f"위생 점검 미흡 - {inspection.hygiene_notes or '상세 내용 확인 필요'}",
            priority=TaskPriority.HIGH,
            status=TaskStatus.PENDING,
        )
        db.add(task)
        created_tasks.append("위생")

    # 매출 감소면 매출 개선 과제 생성
    if inspection.sales_mom_change is not None and inspection.sales_mom_change < -5:
        task = ImprovementTask(
            store_id=inspection.store_id,
            inspection_id=inspection.id,
            category=TaskCategory.SALES,
            task_description=f"매출 전월 대비 {inspection.sales_mom_change}% 감소 - 원인 분석 및 개선 필요",
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.PENDING,
        )
        db.add(task)
        created_tasks.append("매출")

    # improvement_items에 있는 항목 처리
    if inspection.improvement_items:
        for item in inspection.improvement_items:
            if isinstance(item, dict):
                category_str = item.get("category", "기타")
                description = item.get("description", "개선 필요")
            else:
                category_str = "기타"
                description = str(item)

            cat = TaskCategory.OTHER
            for tc in TaskCategory:
                if tc.value == category_str:
                    cat = tc
                    break

            task = ImprovementTask(
                store_id=inspection.store_id,
                inspection_id=inspection.id,
                category=cat,
                task_description=description,
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.PENDING,
            )
            db.add(task)
            created_tasks.append(category_str)

    await db.commit()

    return {
        "message": f"개선 과제 {len(created_tasks)}건이 자동 생성되었습니다.",
        "created_categories": created_tasks,
    }

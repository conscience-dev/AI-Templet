from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.improvement_task import ImprovementTask, TaskCategory, TaskPriority, TaskStatus
from app.schemas.improvement_task import (
    ImprovementTaskCreateIn,
    ImprovementTaskUpdateIn,
    ImprovementTaskStatusUpdateIn,
    ImprovementTaskOut,
)
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()

def _check_task_permission(user: User):
    if user.role == UserRole.ADMIN:
        return
    from app.models.user import DepartmentType
    if user.department not in [DepartmentType.SUPERVISOR, DepartmentType.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="개선 과제 관련 권한이 필요합니다.")


def _serialize_task(t: ImprovementTask, store_name: str = None) -> ImprovementTaskOut:
    return ImprovementTaskOut(
        id=str(t.id),
        store_id=str(t.store_id),
        store_name=store_name,
        inspection_id=str(t.inspection_id) if t.inspection_id else None,
        category=t.category.value,
        task_description=t.task_description,
        priority=t.priority.value,
        status=t.status.value,
        due_date=t.due_date.isoformat() if t.due_date else None,
        created_at=t.created_at.isoformat(),
        updated_at=t.updated_at.isoformat(),
    )


@router.post("/", response_model=ImprovementTaskOut)
async def create_improvement_task(
    data: ImprovementTaskCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_task_permission(user)

    # category enum 변환
    category = None
    for tc in TaskCategory:
        if tc.value == data.category:
            category = tc
            break
    if not category:
        raise HTTPException(status_code=400, detail="유효하지 않은 카테고리입니다.")

    priority = TaskPriority.MEDIUM
    for tp in TaskPriority:
        if tp.value == data.priority:
            priority = tp
            break

    status = TaskStatus.PENDING
    if data.status:
        for ts in TaskStatus:
            if ts.value == data.status:
                status = ts
                break

    due_date = None
    if data.due_date:
        try:
            due_date = datetime.fromisoformat(data.due_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 완료예정일 형식입니다.")

    task = ImprovementTask(
        store_id=data.store_id,
        inspection_id=data.inspection_id if data.inspection_id else None,
        category=category,
        task_description=data.task_description,
        priority=priority,
        status=status,
        due_date=due_date,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # store name 로드
    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.id == task.id)
        .options(selectinload(ImprovementTask.store))
    )
    task = result.scalar_one()

    return _serialize_task(task, store_name=task.store.store_name if task.store else None)


@router.get("/", response_model=PaginatedResponse[ImprovementTaskOut])
async def list_improvement_tasks(
    page: int = Query(1, ge=1),
    store_id: str = Query("", description="점포 필터"),
    category: str = Query("", description="카테고리 필터"),
    status: str = Query("", description="상태 필터"),
    search: str = Query("", description="설명 검색"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_task_permission(user)

    query = (
        select(ImprovementTask)
        .options(selectinload(ImprovementTask.store))
        .order_by(ImprovementTask.created_at.desc())
    )

    if store_id:
        query = query.where(ImprovementTask.store_id == store_id)
    if category:
        query = query.where(ImprovementTask.category == category)
    if status:
        query = query.where(ImprovementTask.status == status)
    if search:
        query = query.where(ImprovementTask.task_description.contains(search))

    result = await db.execute(query)
    tasks = list(result.scalars().all())

    serialized = [
        _serialize_task(t, store_name=t.store.store_name if t.store else None)
        for t in tasks
    ]
    return paginate(serialized, page)


@router.get("/{task_id}", response_model=ImprovementTaskOut)
async def get_improvement_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_task_permission(user)

    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.id == task_id)
        .options(selectinload(ImprovementTask.store))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="개선 과제를 찾을 수 없습니다.")

    return _serialize_task(task, store_name=task.store.store_name if task.store else None)


@router.patch("/{task_id}", response_model=ImprovementTaskOut)
async def update_improvement_task(
    task_id: str,
    data: ImprovementTaskUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_task_permission(user)

    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.id == task_id)
        .options(selectinload(ImprovementTask.store))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="개선 과제를 찾을 수 없습니다.")

    if data.category is not None:
        for tc in TaskCategory:
            if tc.value == data.category:
                task.category = tc
                break
    if data.task_description is not None:
        task.task_description = data.task_description
    if data.priority is not None:
        for tp in TaskPriority:
            if tp.value == data.priority:
                task.priority = tp
                break
    if data.status is not None:
        for ts in TaskStatus:
            if ts.value == data.status:
                task.status = ts
                break
    if data.due_date is not None:
        try:
            task.due_date = datetime.fromisoformat(data.due_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 완료예정일 형식입니다.")

    await db.commit()
    await db.refresh(task)

    # store 재로드
    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.id == task.id)
        .options(selectinload(ImprovementTask.store))
    )
    task = result.scalar_one()

    return _serialize_task(task, store_name=task.store.store_name if task.store else None)


@router.patch("/{task_id}/status", response_model=ImprovementTaskOut)
async def update_task_status(
    task_id: str,
    data: ImprovementTaskStatusUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """개선 과제 상태 변경."""
    _check_task_permission(user)

    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.id == task_id)
        .options(selectinload(ImprovementTask.store))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="개선 과제를 찾을 수 없습니다.")

    for ts in TaskStatus:
        if ts.value == data.status:
            task.status = ts
            break

    await db.commit()
    await db.refresh(task)

    # store 재로드
    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.id == task.id)
        .options(selectinload(ImprovementTask.store))
    )
    task = result.scalar_one()

    return _serialize_task(task, store_name=task.store.store_name if task.store else None)


@router.delete("/{task_id}")
async def delete_improvement_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """개선 과제 삭제."""
    _check_task_permission(user)

    result = await db.execute(
        select(ImprovementTask).where(ImprovementTask.id == task_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="개선 과제를 찾을 수 없습니다.")

    await db.delete(task)
    await db.commit()

    return {"status": "success", "message": "개선 과제가 삭제되었습니다."}

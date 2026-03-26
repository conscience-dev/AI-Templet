from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskCategory, TaskPriority, TaskStatus
from app.schemas.store_inspection import StoreInspectionOut
from app.dependencies import get_current_user

router = APIRouter()


def _check_sv_permission(user: User):
    if user.role == UserRole.ADMIN:
        return
    from app.models.user import DepartmentType
    if user.department not in [DepartmentType.SUPERVISOR, DepartmentType.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="슈퍼바이저 권한이 필요합니다.")


@router.get("/{inspection_id}", response_model=StoreInspectionOut)
async def get_inspection(
    inspection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점검 기록 상세 조회."""
    _check_sv_permission(user)

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection_id)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
    )
    inspection = result.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

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


@router.post("/{inspection_id}/generate-tasks")
async def generate_tasks(
    inspection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점검 결과로부터 AI 기반 개선 과제 자동 생성."""
    _check_sv_permission(user)

    result = await db.execute(
        select(StoreInspection)
        .where(StoreInspection.id == inspection_id)
        .options(selectinload(StoreInspection.store), selectinload(StoreInspection.supervisor))
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="점검 기록을 찾을 수 없습니다.")

    # 점검 데이터를 프롬프트로 구성
    store_name = inspection.store.store_name if inspection.store else "미상"
    supervisor_name = (inspection.supervisor.name or inspection.supervisor.email) if inspection.supervisor else "미상"

    system_prompt = (
        "당신은 프랜차이즈 매장 관리 전문가입니다. "
        "점검 결과를 분석하여 구체적인 개선 과제를 생성합니다. "
        "반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.\n\n"
        "응답 형식:\n"
        "```json\n"
        '[\n'
        '  {\n'
        '    "category": "품질" | "위생" | "매출" | "운영" | "기타",\n'
        '    "task_description": "구체적인 개선 조치 내용",\n'
        '    "priority": "높음" | "중간" | "낮음"\n'
        '  }\n'
        ']\n'
        "```\n"
        "- 점검 결과에서 문제가 발견된 영역 위주로 과제를 생성하세요.\n"
        "- 각 과제는 실행 가능하고 구체적이어야 합니다.\n"
        "- 최소 1건, 최대 5건의 과제를 생성하세요.\n"
        "- 미흡 항목은 우선순위를 '높음'으로 설정하세요."
    )

    user_prompt = (
        f"## 점검 정보\n"
        f"- 매장: {store_name}\n"
        f"- 점검자: {supervisor_name}\n"
        f"- 점검일: {inspection.inspection_date.isoformat() if inspection.inspection_date else '미기록'}\n\n"
        f"## 점검 결과\n"
        f"- 품질 상태: {inspection.quality_status.value}\n"
        f"- 품질 비고: {inspection.quality_notes or '없음'}\n"
        f"- 위생 상태: {inspection.hygiene_status.value}\n"
        f"- 위생 비고: {inspection.hygiene_notes or '없음'}\n"
        f"- 매출 관련 메모: {inspection.sales_note or '없음'}\n"
        f"- 점주 피드백: {inspection.owner_feedback or '없음'}\n\n"
        f"위 점검 결과를 분석하여 개선 과제를 JSON 배열로 생성해주세요."
    )

    from app.utils.ai import call_claude_json
    from app.services.claude_token_service import get_valid_access_token
    token = await get_valid_access_token(db)
    tasks_data = call_claude_json(system_prompt, user_prompt, token=token)

    if not isinstance(tasks_data, list):
        raise HTTPException(status_code=502, detail="AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.")

    # 유효한 카테고리/우선순위 매핑
    category_map = {e.value: e for e in TaskCategory}
    priority_map = {e.value: e for e in TaskPriority}

    created_tasks = []
    for item in tasks_data[:5]:  # 최대 5건
        category_value = item.get("category", "기타")
        priority_value = item.get("priority", "중간")
        description = item.get("task_description", "")

        if not description:
            continue

        category = category_map.get(category_value, TaskCategory.OTHER)
        priority = priority_map.get(priority_value, TaskPriority.MEDIUM)

        task = ImprovementTask(
            store_id=inspection.store_id,
            inspection_id=inspection.id,
            category=category,
            task_description=description,
            priority=priority,
            status=TaskStatus.PENDING,
        )
        db.add(task)
        created_tasks.append({
            "category": category.value,
            "task_description": description,
            "priority": priority.value,
        })

    await db.commit()

    return {
        "message": f"AI가 개선 과제 {len(created_tasks)}건을 생성했습니다.",
        "tasks": created_tasks,
    }

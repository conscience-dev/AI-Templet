from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.consultation import Consultation
from app.schemas.consultation import ConsultationOut
from app.dependencies import get_current_user

router = APIRouter()


def _check_dev_permission(user: User):
    if user.role == UserRole.ADMIN:
        return
    from app.models.user import DepartmentType
    if user.department not in [DepartmentType.DEV, DepartmentType.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="점포개발팀 권한이 필요합니다.")


@router.get("/{consultation_id}", response_model=ConsultationOut)
async def get_consultation(
    consultation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """상담 기록 상세 조회."""
    _check_dev_permission(user)

    result = await db.execute(
        select(Consultation)
        .where(Consultation.id == consultation_id)
        .options(selectinload(Consultation.prospect), selectinload(Consultation.consultant))
    )
    consultation = result.scalar_one_or_none()

    if not consultation:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    return ConsultationOut(
        id=str(consultation.id),
        prospect_id=str(consultation.prospect_id),
        prospect_name=consultation.prospect.name if consultation.prospect else None,
        consultation_order=consultation.consultation_order,
        consultant_id=str(consultation.consultant_id),
        consultant_name=(consultation.consultant.name or consultation.consultant.email) if consultation.consultant else None,
        consultation_date=consultation.consultation_date.isoformat() if consultation.consultation_date else "",
        content=consultation.content,
        result=consultation.result.value,
        next_action=consultation.next_action,
        created_at=consultation.created_at.isoformat(),
        updated_at=consultation.updated_at.isoformat(),
    )

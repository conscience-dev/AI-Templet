from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.prospect import Prospect
from app.models.consultation import Consultation, ConsultationResult
from app.schemas.consultation import ConsultationCreateIn, ConsultationUpdateIn, ConsultationOut
from app.schemas.common import SuccessOut
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()


def _check_dev_permission(user: User):
    if user.role not in [UserRole.ADMIN, UserRole.DEV_MANAGER, UserRole.DEV_STAFF]:
        raise HTTPException(status_code=403, detail="점포개발팀 권한이 필요합니다.")


def _serialize_consultation(c: Consultation, prospect_name: str = None, consultant_name: str = None) -> ConsultationOut:
    return ConsultationOut(
        id=str(c.id),
        prospect_id=str(c.prospect_id),
        prospect_name=prospect_name,
        consultation_order=c.consultation_order,
        consultant_id=str(c.consultant_id),
        consultant_name=consultant_name,
        consultation_date=c.consultation_date.isoformat() if c.consultation_date else "",
        content=c.content,
        result=c.result.value,
        next_action=c.next_action,
        created_at=c.created_at.isoformat(),
        updated_at=c.updated_at.isoformat(),
    )


@router.post("/", response_model=ConsultationOut)
async def create_consultation(
    data: ConsultationCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    # 가맹문의자 확인
    result = await db.execute(select(Prospect).where(Prospect.id == data.prospect_id))
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    # result enum 변환
    consultation_result = None
    for cr in ConsultationResult:
        if cr.value == data.result:
            consultation_result = cr
            break
    if not consultation_result:
        raise HTTPException(status_code=400, detail="유효하지 않은 상담 결과입니다.")

    # 상담일 파싱
    try:
        consultation_date = datetime.fromisoformat(data.consultation_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 상담일시 형식입니다.")

    consultation = Consultation(
        prospect_id=prospect.id,
        consultation_order=data.consultation_order,
        consultant_id=user.id,
        consultation_date=consultation_date,
        content=data.content,
        result=consultation_result,
        next_action=data.next_action,
    )
    db.add(consultation)
    await db.commit()
    await db.refresh(consultation)

    return _serialize_consultation(
        consultation,
        prospect_name=prospect.name,
        consultant_name=user.name or user.username,
    )


@router.get("/", response_model=PaginatedResponse[ConsultationOut])
async def list_consultations(
    page: int = Query(1, ge=1),
    prospect_id: str = Query("", description="가맹문의자 필터"),
    order: int = Query(0, description="상담 차수 필터"),
    search: str = Query("", description="내용 검색"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    query = (
        select(Consultation)
        .options(selectinload(Consultation.prospect), selectinload(Consultation.consultant))
        .order_by(Consultation.consultation_date.desc())
    )

    if prospect_id:
        query = query.where(Consultation.prospect_id == prospect_id)
    if order > 0:
        query = query.where(Consultation.consultation_order == order)
    if search:
        query = query.where(Consultation.content.contains(search))

    result = await db.execute(query)
    consultations = list(result.scalars().all())

    serialized = [
        _serialize_consultation(
            c,
            prospect_name=c.prospect.name if c.prospect else None,
            consultant_name=(c.consultant.name or c.consultant.username) if c.consultant else None,
        )
        for c in consultations
    ]
    return paginate(serialized, page)


@router.get("/best-practices")
async def get_best_practices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """우수 상담 사례 조회."""
    _check_dev_permission(user)

    # TODO: AI 에이전트 연동하여 우수 상담 사례 분석
    return {
        "message": "우수 상담 사례 분석 기능이 준비 중입니다. 에이전트 연동 후 활성화됩니다.",
        "best_practices": [],
    }


@router.get("/{consultation_id}", response_model=ConsultationOut)
async def get_consultation(
    consultation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(
        select(Consultation)
        .where(Consultation.id == consultation_id)
        .options(selectinload(Consultation.prospect), selectinload(Consultation.consultant))
    )
    consultation = result.scalar_one_or_none()

    if not consultation:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    return _serialize_consultation(
        consultation,
        prospect_name=consultation.prospect.name if consultation.prospect else None,
        consultant_name=(consultation.consultant.name or consultation.consultant.username) if consultation.consultant else None,
    )


@router.patch("/{consultation_id}", response_model=ConsultationOut)
async def update_consultation(
    consultation_id: str,
    data: ConsultationUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(
        select(Consultation)
        .where(Consultation.id == consultation_id)
        .options(selectinload(Consultation.prospect), selectinload(Consultation.consultant))
    )
    consultation = result.scalar_one_or_none()

    if not consultation:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    if data.consultation_date is not None:
        try:
            consultation.consultation_date = datetime.fromisoformat(data.consultation_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 상담일시 형식입니다.")
    if data.content is not None:
        consultation.content = data.content
    if data.result is not None:
        for cr in ConsultationResult:
            if cr.value == data.result:
                consultation.result = cr
                break
    if data.next_action is not None:
        consultation.next_action = data.next_action

    await db.commit()
    await db.refresh(consultation)

    return _serialize_consultation(
        consultation,
        prospect_name=consultation.prospect.name if consultation.prospect else None,
        consultant_name=(consultation.consultant.name or consultation.consultant.username) if consultation.consultant else None,
    )


@router.delete("/{consultation_id}", response_model=SuccessOut)
async def delete_consultation(
    consultation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
    consultation = result.scalar_one_or_none()

    if not consultation:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    await db.delete(consultation)
    await db.commit()

    return {"detail": "상담 기록이 삭제되었습니다."}


@router.post("/{consultation_id}/ai-summary")
async def generate_ai_summary(
    consultation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """상담 내용 AI 자동 요약."""
    _check_dev_permission(user)

    result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
    consultation = result.scalar_one_or_none()
    if not consultation:
        raise HTTPException(status_code=404, detail="상담 기록을 찾을 수 없습니다.")

    # TODO: AI 에이전트 연동하여 상담 요약 생성
    return {
        "consultation_id": str(consultation.id),
        "summary": "AI 요약 기능이 준비 중입니다. 에이전트 연동 후 활성화됩니다.",
    }

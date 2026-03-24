from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.prospect import Prospect, InquiryPath, ProspectStatus
from app.models.consultation import Consultation
from app.schemas.prospect import ProspectCreateIn, ProspectUpdateIn, ProspectOut, ConversionAnalyticsOut
from app.schemas.consultation import ConsultationOut
from app.schemas.common import SuccessOut
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()

ALLOWED_ROLES = [UserRole.ADMIN, UserRole.DEV_MANAGER, UserRole.DEV_STAFF, UserRole.EXECUTIVE]


def _check_dev_permission(user: User):
    """점포개발팀 또는 관리자 권한 확인."""
    if user.role not in [UserRole.ADMIN, UserRole.DEV_MANAGER, UserRole.DEV_STAFF, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="점포개발팀 권한이 필요합니다.")


def _serialize_prospect(prospect: Prospect) -> ProspectOut:
    return ProspectOut(
        id=str(prospect.id),
        name=prospect.name,
        phone=prospect.phone,
        email=prospect.email,
        inquiry_path=prospect.inquiry_path.value,
        hope_region=prospect.hope_region,
        startup_budget=prospect.startup_budget,
        tasted=prospect.tasted,
        status=prospect.status.value,
        created_at=prospect.created_at.isoformat(),
        updated_at=prospect.updated_at.isoformat(),
    )


@router.post("/", response_model=ProspectOut)
async def create_prospect(
    data: ProspectCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    # 전화번호 중복 확인
    result = await db.execute(select(Prospect).where(Prospect.phone == data.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 등록된 전화번호입니다.")

    # inquiry_path enum 변환
    inquiry_path = None
    for ip in InquiryPath:
        if ip.value == data.inquiry_path:
            inquiry_path = ip
            break
    if not inquiry_path:
        raise HTTPException(status_code=400, detail="유효하지 않은 문의 경로입니다.")

    # status enum 변환
    status = ProspectStatus.NEW
    if data.status:
        for s in ProspectStatus:
            if s.value == data.status:
                status = s
                break

    prospect = Prospect(
        name=data.name,
        phone=data.phone,
        email=data.email,
        inquiry_path=inquiry_path,
        hope_region=data.hope_region,
        startup_budget=data.startup_budget,
        tasted=data.tasted,
        status=status,
    )
    db.add(prospect)
    await db.commit()
    await db.refresh(prospect)

    return _serialize_prospect(prospect)


@router.get("/", response_model=PaginatedResponse[ProspectOut])
async def list_prospects(
    page: int = Query(1, ge=1),
    status: str = Query("", description="상태 필터"),
    region: str = Query("", description="지역 필터"),
    search: str = Query("", description="이름/전화번호 검색"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    query = select(Prospect).order_by(Prospect.created_at.desc())

    if status:
        query = query.where(Prospect.status == status)
    if region:
        query = query.where(Prospect.hope_region.contains(region))
    if search:
        query = query.where(
            (Prospect.name.contains(search)) | (Prospect.phone.contains(search))
        )

    result = await db.execute(query)
    prospects = list(result.scalars().all())
    serialized = [_serialize_prospect(p) for p in prospects]
    return paginate(serialized, page)


@router.get("/conversion-analytics", response_model=ConversionAnalyticsOut)
async def get_conversion_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """상담 전환율 분석."""
    if user.role not in [UserRole.ADMIN, UserRole.DEV_MANAGER, UserRole.EXECUTIVE]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    result = await db.execute(select(Prospect))
    prospects = list(result.scalars().all())

    total = len(prospects)
    status_counts = {}
    for p in prospects:
        val = p.status.value
        status_counts[val] = status_counts.get(val, 0) + 1

    contracted_count = status_counts.get("성약", 0)
    conversion_rate = (contracted_count / total * 100) if total > 0 else 0.0

    # 성약 고객의 평균 상담 횟수 계산
    avg_consultations = None
    if contracted_count > 0:
        contracted_prospects = [p for p in prospects if p.status == ProspectStatus.CONTRACTED]
        total_consultations = 0
        for cp in contracted_prospects:
            count_result = await db.execute(
                select(func.count()).select_from(Consultation).where(
                    Consultation.prospect_id == cp.id
                )
            )
            total_consultations += count_result.scalar()
        avg_consultations = total_consultations / contracted_count

    return ConversionAnalyticsOut(
        total_prospects=total,
        status_counts=status_counts,
        conversion_rate=round(conversion_rate, 2),
        avg_consultations_to_contract=round(avg_consultations, 2) if avg_consultations else None,
    )


@router.get("/{prospect_id}", response_model=ProspectOut)
async def get_prospect(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
    prospect = result.scalar_one_or_none()

    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    return _serialize_prospect(prospect)


@router.patch("/{prospect_id}", response_model=ProspectOut)
async def update_prospect(
    prospect_id: str,
    data: ProspectUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
    prospect = result.scalar_one_or_none()

    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    if data.name is not None:
        prospect.name = data.name
    if data.phone is not None:
        # 전화번호 중복 확인
        existing = await db.execute(
            select(Prospect).where(Prospect.phone == data.phone, Prospect.id != prospect.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="이미 등록된 전화번호입니다.")
        prospect.phone = data.phone
    if data.email is not None:
        prospect.email = data.email
    if data.inquiry_path is not None:
        for ip in InquiryPath:
            if ip.value == data.inquiry_path:
                prospect.inquiry_path = ip
                break
    if data.hope_region is not None:
        prospect.hope_region = data.hope_region
    if data.startup_budget is not None:
        prospect.startup_budget = data.startup_budget
    if data.tasted is not None:
        prospect.tasted = data.tasted
    if data.status is not None:
        for s in ProspectStatus:
            if s.value == data.status:
                prospect.status = s
                break

    await db.commit()
    await db.refresh(prospect)

    return _serialize_prospect(prospect)


@router.delete("/{prospect_id}", response_model=SuccessOut)
async def delete_prospect(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
    prospect = result.scalar_one_or_none()

    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    await db.delete(prospect)
    await db.commit()

    return {"detail": "가맹문의자가 삭제되었습니다."}


@router.get("/{prospect_id}/consultations", response_model=list[ConsultationOut])
async def get_prospect_consultations(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 가맹문의자의 모든 상담 이력 조회."""
    _check_dev_permission(user)

    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    result = await db.execute(
        select(Consultation)
        .where(Consultation.prospect_id == prospect_id)
        .options(selectinload(Consultation.consultant))
        .order_by(Consultation.consultation_order.asc())
    )
    consultations = list(result.scalars().all())

    return [
        ConsultationOut(
            id=str(c.id),
            prospect_id=str(c.prospect_id),
            prospect_name=prospect.name,
            consultation_order=c.consultation_order,
            consultant_id=str(c.consultant_id),
            consultant_name=c.consultant.name or c.consultant.username if c.consultant else None,
            consultation_date=c.consultation_date.isoformat() if c.consultation_date else "",
            content=c.content,
            result=c.result.value,
            next_action=c.next_action,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in consultations
    ]


@router.get("/{prospect_id}/consultation-summary")
async def get_consultation_summary(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """상담 이력 AI 요약 조회."""
    _check_dev_permission(user)

    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    # TODO: AI 에이전트 연동하여 상담 이력 요약 생성
    return {
        "prospect_id": str(prospect.id),
        "prospect_name": prospect.name,
        "summary": "AI 요약 기능이 준비 중입니다. 에이전트 연동 후 활성화됩니다.",
    }


@router.post("/{prospect_id}/next-consultation-tips")
async def generate_next_consultation_tips(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """다음 상담 팁 AI 생성."""
    _check_dev_permission(user)

    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    # TODO: AI 에이전트 연동하여 다음 상담 팁 생성
    return {
        "prospect_id": str(prospect.id),
        "prospect_name": prospect.name,
        "tips": "AI 팁 생성 기능이 준비 중입니다. 에이전트 연동 후 활성화됩니다.",
    }

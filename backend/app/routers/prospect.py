from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.prospect import Prospect, InquiryPath, ProspectStatus
from app.models.consultation import Consultation, ConsultationResult
from app.schemas.prospect import ProspectCreateIn, ProspectUpdateIn, ProspectOut
from app.schemas.consultation import ConsultationCreateIn, ConsultationOut
from app.dependencies import get_current_user
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()

def _check_dev_permission(user: User):
    """점포개발팀 또는 관리자 권한 확인."""
    if user.role == UserRole.ADMIN:
        return
    from app.models.user import DepartmentType
    if user.department not in [DepartmentType.DEV, DepartmentType.EXECUTIVE]:
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
        status=prospect.status.value,
        assigned_user_id=str(prospect.assigned_user_id) if prospect.assigned_user_id else None,
        assigned_user_name=prospect.assigned_user.name if prospect.assigned_user else None,
        memo=prospect.memo,
        created_at=prospect.created_at.isoformat(),
        updated_at=prospect.updated_at.isoformat(),
    )


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
        status=status,
        assigned_user_id=data.assigned_user_id if data.assigned_user_id else None,
        memo=data.memo,
    )
    db.add(prospect)
    await db.commit()
    await db.refresh(prospect)

    # assigned_user 로드
    result = await db.execute(
        select(Prospect).where(Prospect.id == prospect.id).options(selectinload(Prospect.assigned_user))
    )
    prospect = result.scalar_one()

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

    query = select(Prospect).options(selectinload(Prospect.assigned_user)).order_by(Prospect.created_at.desc())

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


# ──────────────────────────────────────────────
# 상담 체크리스트 (정적 경로 — /{prospect_id} 보다 위에 배치)
# ──────────────────────────────────────────────

CONSULTATION_CHECKLIST = [
    # 기본정보
    {"id": "basic_01", "category": "기본정보", "description": "브랜드 소개 및 비전 공유", "required": True},
    {"id": "basic_02", "category": "기본정보", "description": "고객 창업 동기 및 경험 확인", "required": True},
    {"id": "basic_03", "category": "기본정보", "description": "고객 희망 지역 및 입지 조건 파악", "required": True},
    # 비용안내
    {"id": "cost_01", "category": "비용안내", "description": "가맹비 및 로열티 상세 설명", "required": True},
    {"id": "cost_02", "category": "비용안내", "description": "예상 매출 및 수익 구조 안내", "required": True},
    {"id": "cost_03", "category": "비용안내", "description": "인테리어 비용 및 시공 기간 설명", "required": True},
    {"id": "cost_04", "category": "비용안내", "description": "기타 초기 투자 비용 안내 (보증금, 집기 등)", "required": False},
    # 상권분석
    {"id": "area_01", "category": "상권분석", "description": "상권 분석 자료 제공 또는 실시 안내", "required": True},
    {"id": "area_02", "category": "상권분석", "description": "경쟁 업체 분석 공유", "required": False},
    {"id": "area_03", "category": "상권분석", "description": "유동인구 및 배후 수요 설명", "required": False},
    # 교육/운영
    {"id": "ops_01", "category": "교육/운영", "description": "교육 프로그램 일정 및 내용 안내", "required": True},
    {"id": "ops_02", "category": "교육/운영", "description": "오픈 일정 및 절차 안내", "required": True},
    {"id": "ops_03", "category": "교육/운영", "description": "본사 지원 사항 안내 (마케팅, 물류 등)", "required": False},
    {"id": "ops_04", "category": "교육/운영", "description": "점주 우려사항 청취 및 대응", "required": True},
]


@router.get("/consultation-checklist")
async def get_consultation_checklist(
    user: User = Depends(get_current_user),
):
    """상담 체크리스트 반환."""
    _check_dev_permission(user)
    return {"items": CONSULTATION_CHECKLIST}


# ──────────────────────────────────────────────
# 우수 상담 사례 분석 (정적 경로 — /{prospect_id} 보다 위에 배치)
# ──────────────────────────────────────────────

@router.get("/best-practices")
async def get_best_practices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """전환율 높은 상담 사례 분석."""
    _check_dev_permission(user)

    # 성약된 문의자 조회
    result = await db.execute(
        select(Prospect).where(Prospect.status == ProspectStatus.CONTRACTED)
    )
    contracted_prospects = list(result.scalars().all())
    total_contracted = len(contracted_prospects)

    if total_contracted == 0:
        return {
            "total_contracted": 0,
            "avg_consultations": 0,
            "common_patterns": ["아직 성약 사례가 없습니다. 상담을 진행해주세요."],
            "tips": ["첫 상담에서 고객의 창업 동기를 깊이 파악하세요."],
        }

    # 성약 문의자들의 상담 횟수 통계
    prospect_ids = [p.id for p in contracted_prospects]
    consultation_counts = []
    all_consultation_results = []

    for pid in prospect_ids:
        cons_result = await db.execute(
            select(Consultation)
            .where(Consultation.prospect_id == pid)
            .order_by(Consultation.consultation_order.asc())
        )
        consultations = list(cons_result.scalars().all())
        consultation_counts.append(len(consultations))
        for c in consultations:
            all_consultation_results.append(c.result.value)

    avg_consultations = round(sum(consultation_counts) / len(consultation_counts), 1) if consultation_counts else 0

    # 긍정 비율 분석
    positive_count = all_consultation_results.count("긍정")
    total_results = len(all_consultation_results)
    positive_ratio = round((positive_count / total_results * 100), 1) if total_results > 0 else 0

    # 문의 경로 분석
    inquiry_paths = [p.inquiry_path.value for p in contracted_prospects]
    path_counts = {}
    for path in inquiry_paths:
        path_counts[path] = path_counts.get(path, 0) + 1
    top_path = max(path_counts, key=path_counts.get) if path_counts else "미상"

    common_patterns = [
        f"평균 {avg_consultations}회 상담 후 성약에 이르렀습니다.",
        f"상담 결과 중 '{positive_ratio}%'가 긍정적이었습니다.",
        f"가장 많은 성약 경로는 '{top_path}'입니다.",
    ]

    tips = [
        "첫 상담에서 고객의 창업 동기와 예산을 명확히 파악하세요.",
        "2차 상담 전 상권 분석 자료를 미리 준비하면 전환율이 높아집니다.",
        "비용 설명 시 투자 대비 수익률(ROI)을 함께 제시하세요.",
        "고객의 우려사항을 경청하고 구체적인 사례로 대응하세요.",
        "상담 후 24시간 내 후속 연락(문자/전화)을 하면 효과적입니다.",
    ]

    return {
        "total_contracted": total_contracted,
        "avg_consultations": avg_consultations,
        "common_patterns": common_patterns,
        "tips": tips,
    }


@router.get("/{prospect_id}", response_model=ProspectOut)
async def get_prospect(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_dev_permission(user)

    result = await db.execute(
        select(Prospect).where(Prospect.id == prospect_id).options(selectinload(Prospect.assigned_user))
    )
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
    if data.assigned_user_id is not None:
        prospect.assigned_user_id = data.assigned_user_id if data.assigned_user_id else None
    if data.memo is not None:
        prospect.memo = data.memo
    if data.status is not None:
        for s in ProspectStatus:
            if s.value == data.status:
                prospect.status = s
                break

    await db.commit()
    await db.refresh(prospect)

    # assigned_user 재로드
    result = await db.execute(
        select(Prospect).where(Prospect.id == prospect.id).options(selectinload(Prospect.assigned_user))
    )
    prospect = result.scalar_one()

    return _serialize_prospect(prospect)


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
        _serialize_consultation(
            c,
            prospect_name=prospect.name,
            consultant_name=c.consultant.name or c.consultant.email if c.consultant else None,
        )
        for c in consultations
    ]


@router.post("/{prospect_id}/consultations", response_model=ConsultationOut)
async def create_consultation(
    prospect_id: str,
    data: ConsultationCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """특정 가맹문의자에 대한 상담 기록 생성."""
    _check_dev_permission(user)

    # 가맹문의자 확인
    result = await db.execute(select(Prospect).where(Prospect.id == prospect_id))
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
        consultant_name=user.name or user.email,
    )


@router.post("/{prospect_id}/ai-summary")
async def get_ai_summary(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """상담 이력 AI 요약."""
    _check_dev_permission(user)

    result = await db.execute(
        select(Prospect).where(Prospect.id == prospect_id).options(selectinload(Prospect.assigned_user))
    )
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    # 상담 이력 조회
    cons_result = await db.execute(
        select(Consultation)
        .where(Consultation.prospect_id == prospect_id)
        .options(selectinload(Consultation.consultant))
        .order_by(Consultation.consultation_order.asc())
    )
    consultations = list(cons_result.scalars().all())

    if not consultations:
        return {
            "prospect_id": str(prospect.id),
            "prospect_name": prospect.name,
            "summary": "상담 이력이 없어 요약을 생성할 수 없습니다.",
        }

    # 상담 이력 텍스트 구성
    consultation_text = ""
    for c in consultations:
        consultant_name = (c.consultant.name or c.consultant.email) if c.consultant else "미상"
        consultation_text += (
            f"[{c.consultation_order}차 상담] "
            f"일시: {c.consultation_date.isoformat() if c.consultation_date else '미기록'} | "
            f"상담원: {consultant_name} | "
            f"결과: {c.result.value}\n"
            f"내용: {c.content}\n"
        )
        if c.next_action:
            consultation_text += f"다음 액션: {c.next_action}\n"
        consultation_text += "\n"

    system_prompt = (
        "당신은 프랜차이즈 가맹 상담 실무자입니다. "
        "주어진 가맹문의자 정보와 상담 이력을 분석하여 핵심 요약을 제공합니다. "
        "짧고 구조적으로 작성하세요. 마크다운 형식을 사용합니다."
    )

    user_prompt = (
        f"## 가맹문의자 정보\n"
        f"- 이름: {prospect.name}\n"
        f"- 전화번호: {prospect.phone}\n"
        f"- 문의경로: {prospect.inquiry_path.value}\n"
        f"- 희망지역: {prospect.hope_region or '미정'}\n"
        f"- 창업예산: {f'{prospect.startup_budget:,}만원' if prospect.startup_budget else '미정'}\n"
        f"- 현재상태: {prospect.status.value}\n"
        f"- 담당자: {prospect.assigned_user.name if prospect.assigned_user else '미배정'}\n"
        f"- 메모: {prospect.memo or '없음'}\n\n"
        f"## 상담 이력 ({len(consultations)}건)\n"
        f"{consultation_text}\n"
        f"위 정보를 바탕으로 다음 항목을 포함한 요약을 작성해주세요:\n"
        f"1. 핵심 관심사 (고객이 가장 중요하게 생각하는 것)\n"
        f"2. 현재 진행 단계 (어디까지 진행되었는지)\n"
        f"3. 고객 우려사항 (계약 전 해소해야 할 우려)\n"
        f"4. 핵심 포인트 3~5개 (짧은 불릿 포인트로)"
    )

    from app.utils.ai import call_claude
    from app.services.claude_token_service import get_valid_access_token
    token = await get_valid_access_token(db)
    summary = call_claude(system_prompt, user_prompt, token=token)

    return {
        "prospect_id": str(prospect.id),
        "prospect_name": prospect.name,
        "summary": summary,
    }


@router.post("/{prospect_id}/next-action")
async def generate_next_action(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """다음 액션 AI 제안."""
    _check_dev_permission(user)

    result = await db.execute(
        select(Prospect).where(Prospect.id == prospect_id).options(selectinload(Prospect.assigned_user))
    )
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    # 상담 이력 조회
    cons_result = await db.execute(
        select(Consultation)
        .where(Consultation.prospect_id == prospect_id)
        .options(selectinload(Consultation.consultant))
        .order_by(Consultation.consultation_order.asc())
    )
    consultations = list(cons_result.scalars().all())

    # 상담 이력 텍스트 구성
    consultation_text = ""
    if consultations:
        for c in consultations:
            consultant_name = (c.consultant.name or c.consultant.email) if c.consultant else "미상"
            consultation_text += (
                f"[{c.consultation_order}차 상담] "
                f"일시: {c.consultation_date.isoformat() if c.consultation_date else '미기록'} | "
                f"상담원: {consultant_name} | "
                f"결과: {c.result.value}\n"
                f"내용: {c.content}\n"
            )
            if c.next_action:
                consultation_text += f"다음 액션: {c.next_action}\n"
            consultation_text += "\n"
    else:
        consultation_text = "아직 상담 이력이 없습니다.\n"

    # 가장 최근 상담 정보
    latest = consultations[-1] if consultations else None
    latest_info = ""
    if latest:
        latest_info = (
            f"## 가장 최근 상담\n"
            f"- 차수: {latest.consultation_order}차\n"
            f"- 결과: {latest.result.value}\n"
            f"- 내용: {latest.content}\n"
            f"- 다음 액션(기존): {latest.next_action or '없음'}\n\n"
        )

    system_prompt = (
        "당신은 프랜차이즈 가맹 상담 전문가입니다. "
        "가맹문의자 정보와 상담 이력을 분석하여 실행 가능한 다음 액션을 제안합니다. "
        "구체적이고 실무에 바로 적용 가능한 조언을 마크다운 형식으로 작성하세요."
    )

    user_prompt = (
        f"## 가맹문의자 정보\n"
        f"- 이름: {prospect.name}\n"
        f"- 문의경로: {prospect.inquiry_path.value}\n"
        f"- 희망지역: {prospect.hope_region or '미정'}\n"
        f"- 창업예산: {f'{prospect.startup_budget:,}만원' if prospect.startup_budget else '미정'}\n"
        f"- 현재상태: {prospect.status.value}\n"
        f"- 담당자: {prospect.assigned_user.name if prospect.assigned_user else '미배정'}\n"
        f"- 메모: {prospect.memo or '없음'}\n\n"
        f"{latest_info}"
        f"## 전체 상담 이력 ({len(consultations)}건)\n"
        f"{consultation_text}\n"
        f"위 정보를 바탕으로 다음 항목을 작성해주세요:\n"
        f"1. 다음 상담에서 꼭 물어봐야 할 질문 (2~3개)\n"
        f"2. 설득 포인트 (고객을 설득할 수 있는 핵심 논리)\n"
        f"3. 주의할 리스크 (상담 실패 가능성이 있는 요소)\n"
        f"4. 추천 다음 액션 (구체적인 행동 계획)"
    )

    from app.utils.ai import call_claude
    from app.services.claude_token_service import get_valid_access_token
    token = await get_valid_access_token(db)
    recommendation = call_claude(system_prompt, user_prompt, token=token)

    return {
        "prospect_id": str(prospect.id),
        "prospect_name": prospect.name,
        "recommendation": recommendation,
    }


# ──────────────────────────────────────────────
# 상담 피드백 (AI 기반)
# ──────────────────────────────────────────────

@router.post("/{prospect_id}/consultation-feedback")
async def get_consultation_feedback(
    prospect_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """최신 상담 내용을 분석하여 AI 피드백을 제공합니다."""
    _check_dev_permission(user)

    result = await db.execute(
        select(Prospect).where(Prospect.id == prospect_id).options(selectinload(Prospect.assigned_user))
    )
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="가맹문의자를 찾을 수 없습니다.")

    # 상담 이력 조회
    cons_result = await db.execute(
        select(Consultation)
        .where(Consultation.prospect_id == prospect_id)
        .options(selectinload(Consultation.consultant))
        .order_by(Consultation.consultation_order.asc())
    )
    consultations = list(cons_result.scalars().all())

    if not consultations:
        return {
            "prospect_id": str(prospect.id),
            "prospect_name": prospect.name,
            "score": 0,
            "strengths": [],
            "improvements": ["상담 이력이 없어 피드백을 생성할 수 없습니다."],
            "missed_items": [],
            "recommended_script": "아직 상담 기록이 없습니다. 첫 상담을 진행해주세요.",
        }

    # 상담 이력 텍스트 구성
    consultation_text = ""
    for c in consultations:
        consultant_name = (c.consultant.name or c.consultant.email) if c.consultant else "미상"
        consultation_text += (
            f"[{c.consultation_order}차 상담] "
            f"일시: {c.consultation_date.isoformat() if c.consultation_date else '미기록'} | "
            f"상담원: {consultant_name} | "
            f"결과: {c.result.value}\n"
            f"내용: {c.content}\n"
        )
        if c.next_action:
            consultation_text += f"다음 액션: {c.next_action}\n"
        consultation_text += "\n"

    # 체크리스트 항목 목록 구성
    checklist_text = "\n".join(
        f"- [{item['category']}] {item['description']} ({'필수' if item['required'] else '선택'})"
        for item in CONSULTATION_CHECKLIST
    )

    system_prompt = (
        "당신은 프랜차이즈 가맹 상담 품질 분석 전문가입니다. "
        "주어진 상담 내용을 분석하여 품질 피드백을 JSON 형식으로 제공합니다. "
        "반드시 아래 JSON 형식으로만 응답하세요.\n\n"
        "```json\n"
        "{\n"
        '  "score": 7,\n'
        '  "strengths": ["잘한 점1", "잘한 점2"],\n'
        '  "improvements": ["개선할 점1", "개선할 점2"],\n'
        '  "missed_items": ["빠트린 항목1", "빠트린 항목2"],\n'
        '  "recommended_script": "추천 응대 스크립트 텍스트"\n'
        "}\n"
        "```\n\n"
        "score는 1~10 사이 정수입니다. "
        "빠트린 항목은 아래 체크리스트 중 상담에서 다루지 않은 항목을 찾아 작성합니다."
    )

    user_prompt = (
        f"## 가맹문의자 정보\n"
        f"- 이름: {prospect.name}\n"
        f"- 문의경로: {prospect.inquiry_path.value}\n"
        f"- 희망지역: {prospect.hope_region or '미정'}\n"
        f"- 창업예산: {f'{prospect.startup_budget:,}만원' if prospect.startup_budget else '미정'}\n"
        f"- 현재상태: {prospect.status.value}\n\n"
        f"## 상담 체크리스트\n{checklist_text}\n\n"
        f"## 상담 이력 ({len(consultations)}건)\n{consultation_text}\n"
        f"위 상담 내용을 분석하여 JSON 형식으로 피드백을 작성해주세요."
    )

    from app.utils.ai import call_claude_json
    from app.services.claude_token_service import get_valid_access_token
    token = await get_valid_access_token(db)
    feedback = call_claude_json(system_prompt, user_prompt, token=token)

    return {
        "prospect_id": str(prospect.id),
        "prospect_name": prospect.name,
        "score": feedback.get("score", 5),
        "strengths": feedback.get("strengths", []),
        "improvements": feedback.get("improvements", []),
        "missed_items": feedback.get("missed_items", []),
        "recommended_script": feedback.get("recommended_script", ""),
    }

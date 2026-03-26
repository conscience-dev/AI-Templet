from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, DepartmentType
from app.models.prospect import Prospect, ProspectStatus
from app.models.consultation import Consultation
from app.models.store import Store
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskStatus, TaskPriority
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/summary")
async def summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """전사 지표 요약 대시보드."""
    # 가맹문의자 현황
    prospect_result = await db.execute(select(Prospect))
    prospects = list(prospect_result.scalars().all())
    prospect_total = len(prospects)
    prospect_status = {}
    for p in prospects:
        val = p.status.value
        prospect_status[val] = prospect_status.get(val, 0) + 1

    # 전환율
    contracted = prospect_status.get("성약", 0)
    conversion_rate = round((contracted / prospect_total * 100), 2) if prospect_total > 0 else 0.0

    # 점포 현황
    store_result = await db.execute(select(Store))
    stores = list(store_result.scalars().all())
    store_total = len(stores)
    store_status = {}
    for s in stores:
        val = s.status.value
        store_status[val] = store_status.get(val, 0) + 1

    # 개선 과제 현황
    task_result = await db.execute(select(ImprovementTask))
    tasks = list(task_result.scalars().all())
    task_status = {}
    for t in tasks:
        val = t.status.value
        task_status[val] = task_status.get(val, 0) + 1

    pending_tasks = task_status.get("미처리", 0)

    # 최근 점검 수
    inspection_count_result = await db.execute(
        select(func.count()).select_from(StoreInspection)
    )
    total_inspections = inspection_count_result.scalar()

    # 이번 달 신규 문의자 수
    now = datetime.now(timezone.utc)
    new_this_month = sum(
        1 for p in prospects
        if p.created_at and p.created_at.month == now.month and p.created_at.year == now.year
    )

    # 이번 달 상담 수
    consultation_result = await db.execute(select(Consultation))
    consultations = list(consultation_result.scalars().all())
    consultations_this_month = sum(
        1 for c in consultations
        if c.consultation_date and c.consultation_date.month == now.month and c.consultation_date.year == now.year
    )

    # 지연 과제
    now_naive = now.replace(tzinfo=None)
    overdue = sum(
        1 for t in tasks
        if t.status.value != "완료" and t.due_date and t.due_date < now_naive
    )

    return {
        "total_prospects": prospect_total,
        "new_prospects_this_month": new_this_month,
        "prospect_conversion_rate": conversion_rate,
        "total_stores": store_total,
        "active_stores": store_status.get("운영중", 0),
        "average_health_score": 0,
        "pending_improvement_tasks": pending_tasks,
        "overdue_tasks": overdue,
        "monthly_inspections": total_inspections,
        "consultation_count_this_month": consultations_this_month,
    }


@router.get("/prospect-metrics")
async def prospect_metrics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """가맹문의 지표 (상담 전환율, 진행 현황)."""
    # 가맹문의자 상태별 현황
    prospect_result = await db.execute(select(Prospect))
    prospects = list(prospect_result.scalars().all())
    prospect_status = {}
    for p in prospects:
        val = p.status.value
        prospect_status[val] = prospect_status.get(val, 0) + 1

    # 전환율
    total = len(prospects)
    contracted = prospect_status.get("성약", 0)
    conversion_rate = round((contracted / total * 100), 2) if total > 0 else 0.0

    # 상담 기록 현황
    consultation_result = await db.execute(select(Consultation))
    consultations = list(consultation_result.scalars().all())
    total_consultations = len(consultations)

    # 상담 결과별 분포
    result_dist = {}
    for c in consultations:
        val = c.result.value
        result_dist[val] = result_dist.get(val, 0) + 1

    # 상담중인 문의자
    in_progress = prospect_status.get("상담중", 0)
    new_prospects = prospect_status.get("신규", 0)

    return {
        "prospects_by_status": prospect_status,
        "prospects_by_region": {},
        "consultations_this_week": 0,
        "consultations_this_month": total_consultations,
        "upcoming_contacts": 0,
        "conversion_funnel": {
            "inquiry": new_prospects,
            "consulting": in_progress,
            "site_visit": 0,
            "contract": prospect_status.get("성약", 0),
            "open": 0,
        },
    }


@router.get("/store-metrics")
async def store_metrics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점포 지표 (점포별 건강도, 개선 과제)."""
    # 점포 현황
    store_result = await db.execute(select(Store))
    stores = list(store_result.scalars().all())
    store_total = len(stores)
    store_status = {}
    for s in stores:
        val = s.status.value
        store_status[val] = store_status.get(val, 0) + 1

    # 최근 점검 현황
    inspection_result = await db.execute(
        select(StoreInspection).order_by(StoreInspection.inspection_date.desc()).limit(20)
    )
    recent_inspections = list(inspection_result.scalars().all())

    quality_poor_count = sum(1 for i in recent_inspections if i.quality_status == QualityStatus.POOR)
    hygiene_poor_count = sum(1 for i in recent_inspections if i.hygiene_status == HygieneStatus.POOR)

    # 개선 과제 현황
    task_result = await db.execute(select(ImprovementTask))
    tasks = list(task_result.scalars().all())
    task_status = {}
    for t in tasks:
        val = t.status.value
        task_status[val] = task_status.get(val, 0) + 1

    task_category = {}
    for t in tasks:
        val = t.category.value
        task_category[val] = task_category.get(val, 0) + 1

    pending = task_status.get("미처리", 0)

    return {
        "assigned_stores": store_total,
        "inspections_this_month": len(recent_inspections),
        "pending_tasks": pending,
        "overdue_tasks": 0,
        "average_store_score": 0,
        "stores_below_threshold": quality_poor_count + hygiene_poor_count,
        "tasks_by_category": task_category,
        "recent_inspections": [
            {
                "id": str(i.id),
                "store_name": "",
                "overall_score": 0,
                "inspection_date": i.inspection_date.isoformat() if i.inspection_date else "",
            }
            for i in recent_inspections[:5]
        ],
    }


@router.get("/executive-summary")
async def executive_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """경영진 전용 요약 (전사 KPI)."""
    now = datetime.now(timezone.utc)
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # 전월 구간
    last_month_end = first_of_month - timedelta(seconds=1)
    # 가맹문의자
    prospect_result = await db.execute(select(Prospect))
    prospects = list(prospect_result.scalars().all())
    total_prospects = len(prospects)
    prospect_status = {}
    for p in prospects:
        prospect_status[p.status.value] = prospect_status.get(p.status.value, 0) + 1

    contracted = prospect_status.get("성약", 0)
    closed = prospect_status.get("종료", 0)
    conversion_rate = round((contracted / total_prospects * 100), 2) if total_prospects > 0 else 0.0
    churn_rate = round((closed / total_prospects * 100), 2) if total_prospects > 0 else 0.0

    # 이번 달 / 전월 비교
    prospects_this_month = sum(
        1 for p in prospects
        if p.created_at and p.created_at.month == now.month and p.created_at.year == now.year
    )
    prospects_last_month = sum(
        1 for p in prospects
        if p.created_at and p.created_at.month == last_month_end.month and p.created_at.year == last_month_end.year
    )

    # 점포
    store_result = await db.execute(select(Store))
    stores = list(store_result.scalars().all())
    total_stores = len(stores)
    stores_this_month = sum(
        1 for s in stores
        if s.created_at and s.created_at.month == now.month and s.created_at.year == now.year
    )
    stores_last_month = sum(
        1 for s in stores
        if s.created_at and s.created_at.month == last_month_end.month and s.created_at.year == last_month_end.year
    )

    # 개선 과제
    task_result = await db.execute(select(ImprovementTask))
    tasks = list(task_result.scalars().all())
    tasks_this_month = sum(
        1 for t in tasks
        if t.created_at and t.created_at.month == now.month and t.created_at.year == now.year
    )
    tasks_last_month = sum(
        1 for t in tasks
        if t.created_at and t.created_at.month == last_month_end.month and t.created_at.year == last_month_end.year
    )

    # 채널별 성과 (유입 경로별)
    channel_counts = {}
    channel_contracted = {}
    for p in prospects:
        ch = p.inquiry_path.value
        channel_counts[ch] = channel_counts.get(ch, 0) + 1
        if p.status == ProspectStatus.CONTRACTED:
            channel_contracted[ch] = channel_contracted.get(ch, 0) + 1

    channel_performance = []
    for ch, cnt in channel_counts.items():
        conv = channel_contracted.get(ch, 0)
        channel_performance.append({
            "channel": ch,
            "count": cnt,
            "conversion_rate": round((conv / cnt * 100), 2) if cnt > 0 else 0.0,
        })

    # 점포 건강도 (점검 결과 기반 간이 점수)
    # 최근 점검이 양호이면 +50, 미흡이면 +0 (품질+위생 각각 50점 만점)
    store_scores = {}
    inspection_result = await db.execute(
        select(StoreInspection).order_by(StoreInspection.inspection_date.desc())
    )
    inspections = list(inspection_result.scalars().all())
    seen_stores = set()
    for insp in inspections:
        sid = str(insp.store_id)
        if sid in seen_stores:
            continue
        seen_stores.add(sid)
        score = 0
        score += 50 if insp.quality_status == QualityStatus.GOOD else 0
        score += 50 if insp.hygiene_status == HygieneStatus.GOOD else 0
        store_scores[sid] = score

    # 우수/위험 점포
    store_name_map = {str(s.id): s.store_name for s in stores}
    scored_stores = [
        {"store_name": store_name_map.get(sid, ""), "health_score": sc}
        for sid, sc in store_scores.items()
        if store_name_map.get(sid)
    ]
    scored_stores.sort(key=lambda x: x["health_score"], reverse=True)
    top_performing = scored_stores[:5]

    risk_stores = []
    for sid, sc in store_scores.items():
        name = store_name_map.get(sid, "")
        if not name:
            continue
        if sc < 50:
            risk_stores.append({
                "store_name": name,
                "risk_level": "높음" if sc == 0 else "중간",
                "reason": "품질/위생 미흡" if sc == 0 else "일부 항목 미흡",
            })
    # 점검 기록 없는 점포도 위험으로 추가
    for s in stores:
        sid = str(s.id)
        if sid not in store_scores and s.status.value == "운영중":
            risk_stores.append({
                "store_name": s.store_name,
                "risk_level": "정보없음",
                "reason": "점검 기록 없음",
            })

    return {
        "total_prospects": total_prospects,
        "total_stores": total_stores,
        "total_revenue_estimate": 0,
        "conversion_rate": conversion_rate,
        "churn_rate": churn_rate,
        "monthly_comparison": {
            "prospects_change": prospects_this_month - prospects_last_month,
            "stores_change": stores_this_month - stores_last_month,
            "tasks_change": tasks_this_month - tasks_last_month,
        },
        "channel_performance": channel_performance,
        "top_performing_stores": top_performing,
        "risk_stores": risk_stores[:5],
    }


@router.get("/dev-summary")
async def dev_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """점포개발팀 전용 (상담 포커스)."""
    now = datetime.now(timezone.utc)

    # 가맹문의자
    prospect_result = await db.execute(select(Prospect))
    prospects = list(prospect_result.scalars().all())
    active_prospects = sum(
        1 for p in prospects
        if p.status.value in ("신규", "상담중")
    )
    prospect_status = {}
    for p in prospects:
        prospect_status[p.status.value] = prospect_status.get(p.status.value, 0) + 1

    total = len(prospects)
    contracted = prospect_status.get("성약", 0)
    conversion_rate = round((contracted / total * 100), 2) if total > 0 else 0.0

    # 상담
    consultation_result = await db.execute(
        select(Consultation).order_by(Consultation.consultation_date.desc())
    )
    consultations = list(consultation_result.scalars().all())
    consultations_this_month = sum(
        1 for c in consultations
        if c.consultation_date and c.consultation_date.month == now.month and c.consultation_date.year == now.year
    )

    # 최근 상담 목록 (최근 10건, prospect/consultant 정보 포함)
    recent_consultation_result = await db.execute(
        select(Consultation)
        .options(selectinload(Consultation.prospect), selectinload(Consultation.consultant))
        .order_by(Consultation.consultation_date.desc())
        .limit(10)
    )
    recent_consultations = list(recent_consultation_result.scalars().all())
    recent_list = []
    for c in recent_consultations:
        recent_list.append({
            "prospect_name": c.prospect.name if c.prospect else "",
            "consultant": c.consultant.name if c.consultant else "",
            "date": c.consultation_date.isoformat() if c.consultation_date else "",
            "result": c.result.value,
        })

    # 채널별 전환율
    channel_counts = {}
    channel_contracted = {}
    for p in prospects:
        ch = p.inquiry_path.value
        channel_counts[ch] = channel_counts.get(ch, 0) + 1
        if p.status == ProspectStatus.CONTRACTED:
            channel_contracted[ch] = channel_contracted.get(ch, 0) + 1
    channel_stats = []
    for ch, cnt in channel_counts.items():
        conv = channel_contracted.get(ch, 0)
        channel_stats.append({
            "channel": ch,
            "count": cnt,
            "conversion_rate": round((conv / cnt * 100), 2) if cnt > 0 else 0.0,
        })

    # 상담자별 성과
    consultant_map = {}  # user_id -> {name, consultations, conversions}
    for c in consultations:
        uid = str(c.consultant_id)
        if uid not in consultant_map:
            consultant_map[uid] = {"name": "", "consultations": 0, "conversions": 0}
        consultant_map[uid]["consultations"] += 1
    # consultant 이름 채우기
    for c in recent_consultations:
        uid = str(c.consultant_id)
        if uid in consultant_map and c.consultant:
            consultant_map[uid]["name"] = c.consultant.name or ""
    # 성약된 prospect의 담당자 기반 전환 수
    for p in prospects:
        if p.status == ProspectStatus.CONTRACTED and p.assigned_user_id:
            uid = str(p.assigned_user_id)
            if uid in consultant_map:
                consultant_map[uid]["conversions"] += 1

    # 이름 없는 상담자 이름 조회
    unnamed_ids = [uid for uid, v in consultant_map.items() if not v["name"]]
    if unnamed_ids:
        user_result = await db.execute(
            select(User).where(User.id.in_(unnamed_ids))
        )
        users = list(user_result.scalars().all())
        for u in users:
            uid = str(u.id)
            if uid in consultant_map:
                consultant_map[uid]["name"] = u.name or u.email

    consultant_performance = list(consultant_map.values())
    consultant_performance.sort(key=lambda x: x["consultations"], reverse=True)

    return {
        "active_prospects": active_prospects,
        "consultations_this_month": consultations_this_month,
        "conversion_rate": conversion_rate,
        "prospects_by_status": prospect_status,
        "recent_consultations": recent_list,
        "channel_stats": channel_stats,
        "consultant_performance": consultant_performance[:10],
    }


@router.get("/supervisor-summary")
async def supervisor_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """슈퍼바이저 전용 (점포 관리 포커스). SV 본인 담당 점포만 (admin은 전체)."""
    now = datetime.now(timezone.utc)
    is_admin = (
        user.department == DepartmentType.ADMIN
        or (hasattr(user, "role") and user.role and user.role.value == "admin")
    )

    # 점포 조회 (SV는 본인 담당만)
    if is_admin:
        store_result = await db.execute(select(Store))
    else:
        store_result = await db.execute(
            select(Store).where(Store.supervisor_id == user.id)
        )
    stores = list(store_result.scalars().all())
    my_stores = len(stores)
    store_ids = [s.id for s in stores]
    store_name_map = {str(s.id): s.store_name for s in stores}

    # 이번 달 점검 수
    all_inspections = []
    if store_ids:
        inspection_result = await db.execute(
            select(StoreInspection)
            .where(StoreInspection.store_id.in_(store_ids))
            .order_by(StoreInspection.inspection_date.desc())
        )
        all_inspections = list(inspection_result.scalars().all())
    inspections_this_month = sum(
        1 for i in all_inspections
        if i.inspection_date and i.inspection_date.month == now.month and i.inspection_date.year == now.year
    )

    # 미처리 과제
    pending_tasks_list = []
    if store_ids:
        task_result = await db.execute(
            select(ImprovementTask).where(
                ImprovementTask.store_id.in_(store_ids),
                ImprovementTask.status != TaskStatus.COMPLETED,
            )
        )
        pending_tasks_list = list(task_result.scalars().all())
    pending_tasks = len(pending_tasks_list)

    # 방문 필요 점포 (마지막 점검 기준, 오래된 순)
    last_inspection_map = {}
    for i in all_inspections:
        sid = str(i.store_id)
        if sid not in last_inspection_map:
            last_inspection_map[sid] = i.inspection_date

    stores_needing_visit = []
    for s in stores:
        sid = str(s.id)
        if s.status.value != "운영중":
            continue
        last_date = last_inspection_map.get(sid)
        if last_date:
            days_since = (now - last_date.replace(tzinfo=timezone.utc if last_date.tzinfo is None else last_date.tzinfo)).days
        else:
            days_since = 999
        stores_needing_visit.append({
            "store_name": s.store_name,
            "last_inspection": last_date.isoformat() if last_date else None,
            "days_since": days_since,
        })
    stores_needing_visit.sort(key=lambda x: x["days_since"], reverse=True)

    # 긴급 과제 (높음 우선순위 또는 기한 지난 것)
    now_naive = now.replace(tzinfo=None)
    urgent_tasks = []
    for t in pending_tasks_list:
        is_overdue = t.due_date and t.due_date.replace(tzinfo=None) < now_naive if t.due_date else False
        is_high = t.priority == TaskPriority.HIGH
        if is_overdue or is_high:
            urgent_tasks.append({
                "store_name": store_name_map.get(str(t.store_id), ""),
                "task_description": t.task_description,
                "priority": t.priority.value,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "is_overdue": is_overdue,
            })
    urgent_tasks.sort(key=lambda x: (not x["is_overdue"], x["priority"] != "높음"))

    # 점포별 건강도
    store_health = []
    for s in stores:
        sid = str(s.id)
        if s.status.value != "운영중":
            continue
        last_insp = None
        for i in all_inspections:
            if str(i.store_id) == sid:
                last_insp = i
                break
        if last_insp:
            score = 0
            score += 50 if last_insp.quality_status == QualityStatus.GOOD else 0
            score += 50 if last_insp.hygiene_status == HygieneStatus.GOOD else 0
        else:
            score = -1  # 점검 없음
        store_health.append({
            "store_name": s.store_name,
            "score": score,
        })
    store_health.sort(key=lambda x: x["score"])

    return {
        "my_stores": my_stores,
        "inspections_this_month": inspections_this_month,
        "pending_tasks": pending_tasks,
        "stores_needing_visit": stores_needing_visit[:10],
        "urgent_tasks": urgent_tasks[:10],
        "store_health": store_health,
    }

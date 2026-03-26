from datetime import datetime, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from app.database import get_db
from app.models.user import User, UserRole, DepartmentType
from app.models.prospect import Prospect, ProspectStatus, InquiryPath
from app.dependencies import get_current_user

router = APIRouter()


def _check_marketing_access(user: User):
    if user.role == UserRole.ADMIN:
        return
    if user.department in [DepartmentType.EXECUTIVE, DepartmentType.DEV]:
        return
    raise HTTPException(status_code=403, detail="마케팅 분석 권한이 필요합니다.")


@router.get("/channel-stats")
async def channel_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """채널별 유입/전환 통계."""
    _check_marketing_access(user)

    result = await db.execute(select(Prospect))
    prospects = list(result.scalars().all())

    # 채널별 집계
    channel_data = defaultdict(lambda: {"total": 0, "consulting": 0, "contracted": 0})

    for p in prospects:
        channel = p.inquiry_path.value
        channel_data[channel]["total"] += 1
        if p.status in [ProspectStatus.IN_CONSULTATION, ProspectStatus.CONTRACTED, ProspectStatus.CLOSED]:
            channel_data[channel]["consulting"] += 1
        if p.status == ProspectStatus.CONTRACTED:
            channel_data[channel]["contracted"] += 1

    channels = []
    for channel, data in channel_data.items():
        conversion_rate = round((data["contracted"] / data["total"] * 100), 1) if data["total"] > 0 else 0.0
        channels.append({
            "channel": channel,
            "total": data["total"],
            "consulting": data["consulting"],
            "contracted": data["contracted"],
            "conversion_rate": conversion_rate,
        })

    # 유입 수 내림차순 정렬
    channels.sort(key=lambda x: x["total"], reverse=True)

    return {"channels": channels}


@router.get("/region-stats")
async def region_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """지역별 유입/전환 통계."""
    _check_marketing_access(user)

    result = await db.execute(select(Prospect))
    prospects = list(result.scalars().all())

    region_data = defaultdict(lambda: {"total": 0, "contracted": 0, "budgets": []})

    for p in prospects:
        region = p.hope_region or "미지정"
        region_data[region]["total"] += 1
        if p.status == ProspectStatus.CONTRACTED:
            region_data[region]["contracted"] += 1
        if p.startup_budget is not None:
            region_data[region]["budgets"].append(p.startup_budget)

    regions = []
    for region, data in region_data.items():
        conversion_rate = round((data["contracted"] / data["total"] * 100), 1) if data["total"] > 0 else 0.0
        avg_budget = round(sum(data["budgets"]) / len(data["budgets"])) if data["budgets"] else 0
        regions.append({
            "region": region,
            "total": data["total"],
            "contracted": data["contracted"],
            "conversion_rate": conversion_rate,
            "avg_budget": avg_budget,
        })

    regions.sort(key=lambda x: x["total"], reverse=True)

    return {"regions": regions}


@router.get("/budget-stats")
async def budget_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """예산 구간별 통계."""
    _check_marketing_access(user)

    result = await db.execute(select(Prospect))
    prospects = list(result.scalars().all())

    # 예산 구간 정의 (만원 단위)
    ranges_def = [
        ("미입력", None, None),
        ("3천만원 미만", 0, 3000),
        ("3천~5천만원", 3000, 5000),
        ("5천~1억원", 5000, 10000),
        ("1억원 이상", 10000, None),
    ]

    range_data = defaultdict(lambda: {"total": 0, "contracted": 0})

    for p in prospects:
        budget = p.startup_budget
        if budget is None:
            range_data["미입력"]["total"] += 1
            if p.status == ProspectStatus.CONTRACTED:
                range_data["미입력"]["contracted"] += 1
            continue

        # 만원 단위로 비교
        budget_man = budget  # startup_budget이 만원 단위로 저장된다고 가정
        for label, low, high in ranges_def:
            if label == "미입력":
                continue
            if low is not None and high is not None:
                if low <= budget_man < high:
                    range_data[label]["total"] += 1
                    if p.status == ProspectStatus.CONTRACTED:
                        range_data[label]["contracted"] += 1
                    break
            elif low is not None and high is None:
                if budget_man >= low:
                    range_data[label]["total"] += 1
                    if p.status == ProspectStatus.CONTRACTED:
                        range_data[label]["contracted"] += 1
                    break
            elif low is None and high is not None:
                if budget_man < high:
                    range_data[label]["total"] += 1
                    if p.status == ProspectStatus.CONTRACTED:
                        range_data[label]["contracted"] += 1
                    break

    ranges = []
    for label, _, _ in ranges_def:
        data = range_data[label]
        if data["total"] == 0 and label != "미입력":
            continue
        conversion_rate = round((data["contracted"] / data["total"] * 100), 1) if data["total"] > 0 else 0.0
        ranges.append({
            "range": label,
            "total": data["total"],
            "contracted": data["contracted"],
            "conversion_rate": conversion_rate,
        })

    return {"ranges": ranges}


@router.get("/monthly-trend")
async def monthly_trend(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """월별 유입/전환 추이 (최근 12개월)."""
    _check_marketing_access(user)

    result = await db.execute(select(Prospect))
    prospects = list(result.scalars().all())

    now = datetime.now(timezone.utc)

    # 최근 12개월 월별 집계
    monthly_data = defaultdict(lambda: {"total": 0, "contracted": 0})

    for p in prospects:
        if p.created_at is None:
            continue
        month_key = p.created_at.strftime("%Y-%m")
        monthly_data[month_key]["total"] += 1
        if p.status == ProspectStatus.CONTRACTED:
            monthly_data[month_key]["contracted"] += 1

    # 최근 12개월 정렬
    months_sorted = sorted(monthly_data.keys())[-12:]

    months = []
    for month_key in months_sorted:
        data = monthly_data[month_key]
        conversion_rate = round((data["contracted"] / data["total"] * 100), 1) if data["total"] > 0 else 0.0
        months.append({
            "month": month_key,
            "total": data["total"],
            "contracted": data["contracted"],
            "conversion_rate": conversion_rate,
        })

    return {"months": months}


@router.get("/summary")
async def marketing_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """마케팅 요약 통계 (요약 카드용)."""
    _check_marketing_access(user)

    result = await db.execute(select(Prospect))
    prospects = list(result.scalars().all())

    total = len(prospects)
    contracted = sum(1 for p in prospects if p.status == ProspectStatus.CONTRACTED)
    conversion_rate = round((contracted / total * 100), 1) if total > 0 else 0.0

    # 이번달 유입
    now = datetime.now(timezone.utc)
    this_month = sum(
        1 for p in prospects
        if p.created_at and p.created_at.year == now.year and p.created_at.month == now.month
    )

    # 채널 수
    channels = set(p.inquiry_path.value for p in prospects)

    return {
        "total_prospects": total,
        "this_month_prospects": this_month,
        "conversion_rate": conversion_rate,
        "channel_count": len(channels),
        "contracted_count": contracted,
    }

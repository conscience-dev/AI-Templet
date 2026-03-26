import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_summary(admin_client: AsyncClient):
    """전사 지표 요약 대시보드 조회."""
    response = await admin_client.get("/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_prospects" in data
    assert "total_stores" in data
    assert "pending_improvement_tasks" in data
    assert "monthly_inspections" in data


@pytest.mark.asyncio
async def test_executive_summary(admin_client: AsyncClient):
    """경영진 요약 대시보드 조회."""
    response = await admin_client.get("/v1/dashboard/executive-summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_prospects" in data
    assert "total_stores" in data
    assert "conversion_rate" in data
    assert "churn_rate" in data
    assert "monthly_comparison" in data
    assert "channel_performance" in data
    assert "top_performing_stores" in data
    assert "risk_stores" in data


@pytest.mark.asyncio
async def test_executive_summary_permission(authenticated_client: AsyncClient):
    """dev 부서 매니저도 경영진 대시보드 접근 가능 (인증만 필요)."""
    response = await authenticated_client.get("/v1/dashboard/executive-summary")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_executive_summary_with_data(admin_client: AsyncClient):
    """데이터가 있는 상태에서 경영진 대시보드 확인."""
    # 문의자 생성
    await admin_client.post("/v1/prospects/", json={
        "name": "대시보드테스트",
        "phone": "010-9999-9999",
        "inquiry_path": "매장방문",
        "status": "성약",
    })

    # 점포 생성
    await admin_client.post("/v1/stores/", json={
        "store_name": "대시보드테스트점",
        "region": "서울",
    })

    response = await admin_client.get("/v1/dashboard/executive-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_prospects"] == 1
    assert data["total_stores"] == 1
    assert data["conversion_rate"] == 100.0


@pytest.mark.asyncio
async def test_dev_summary(authenticated_client: AsyncClient):
    """점포개발팀 대시보드 조회."""
    response = await authenticated_client.get("/v1/dashboard/dev-summary")
    assert response.status_code == 200
    data = response.json()
    assert "active_prospects" in data
    assert "consultations_this_month" in data
    assert "conversion_rate" in data
    assert "prospects_by_status" in data
    assert "recent_consultations" in data


@pytest.mark.asyncio
async def test_store_metrics(admin_client: AsyncClient):
    """점포 지표 대시보드 조회."""
    response = await admin_client.get("/v1/dashboard/store-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "assigned_stores" in data
    assert "pending_tasks" in data
    assert "recent_inspections" in data


@pytest.mark.asyncio
async def test_prospect_metrics(authenticated_client: AsyncClient):
    """가맹문의 지표 대시보드 조회."""
    response = await authenticated_client.get("/v1/dashboard/prospect-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "prospects_by_status" in data
    assert "conversion_funnel" in data


# supervisor_client 테스트는 맨 마지막에 배치
# (supervisor_client fixture가 cleanup 시 app.dependency_overrides를 초기화하기 때문)
@pytest.mark.asyncio
async def test_supervisor_summary(supervisor_client: AsyncClient):
    """슈퍼바이저 대시보드 조회."""
    response = await supervisor_client.get("/v1/dashboard/supervisor-summary")
    assert response.status_code == 200
    data = response.json()
    assert "my_stores" in data
    assert "inspections_this_month" in data
    assert "pending_tasks" in data
    assert "stores_needing_visit" in data
    assert "urgent_tasks" in data
    assert "store_health" in data

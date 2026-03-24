import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_executive_summary(admin_client: AsyncClient):
    response = await admin_client.get("/v1/dashboard/executive-summary")
    assert response.status_code == 200
    data = response.json()
    assert "prospects" in data
    assert "stores" in data
    assert "improvement_tasks" in data
    assert "inspections" in data


@pytest.mark.asyncio
async def test_executive_summary_permission(authenticated_client: AsyncClient):
    """dev_manager는 경영진 대시보드 접근 불가."""
    response = await authenticated_client.get("/v1/dashboard/executive-summary")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_dev_team_metrics(authenticated_client: AsyncClient):
    """dev_manager는 점포개발팀 대시보드 접근 가능."""
    response = await authenticated_client.get("/v1/dashboard/dev-team-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "prospects" in data
    assert "consultations" in data


@pytest.mark.asyncio
async def test_supervisor_metrics(supervisor_client: AsyncClient):
    response = await supervisor_client.get("/v1/dashboard/supervisor-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "stores" in data
    assert "inspections" in data
    assert "improvement_tasks" in data


@pytest.mark.asyncio
async def test_supervisor_metrics_permission(authenticated_client: AsyncClient):
    """dev_manager는 슈퍼바이저 대시보드 접근 불가."""
    response = await authenticated_client.get("/v1/dashboard/supervisor-metrics")
    assert response.status_code == 403


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
    assert data["prospects"]["total"] == 1
    assert data["stores"]["total"] == 1

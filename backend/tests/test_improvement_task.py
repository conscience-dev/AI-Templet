import pytest
from unittest.mock import patch
from httpx import AsyncClient


async def _create_store(client: AsyncClient, name: str = "과제테스트점포") -> str:
    resp = await client.post("/v1/stores/", json={
        "store_name": name,
        "region": "서울",
    })
    assert resp.status_code == 200, f"점포 생성 실패: {resp.status_code} {resp.text}"
    return resp.json()["id"]


async def _create_inspection(client: AsyncClient, store_id: str) -> str:
    """점검 기록 생성 헬퍼 (점포 하위 엔드포인트 사용)."""
    resp = await client.post(f"/v1/stores/{store_id}/inspections", json={
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "미흡",
        "quality_notes": "면 물붓기 시간 미준수",
        "hygiene_status": "미흡",
        "hygiene_notes": "주방 바닥 오염",
    })
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_improvement_task(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    response = await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "품질",
        "task_description": "면 물붓기 시간 준수 교육 필요",
        "priority": "높음",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "품질"
    assert data["priority"] == "높음"
    assert data["status"] == "미처리"
    assert data["store_name"] == "과제테스트점포"


@pytest.mark.asyncio
async def test_list_improvement_tasks(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "위생",
        "task_description": "주방 청소 강화",
    })
    await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "매출",
        "task_description": "프로모션 기획",
    })

    response = await supervisor_client.get("/v1/improvement-tasks/")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 2


@pytest.mark.asyncio
async def test_list_tasks_filter_category(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "위생",
        "task_description": "위생 개선",
    })
    await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "매출",
        "task_description": "매출 개선",
    })

    response = await supervisor_client.get("/v1/improvement-tasks/?category=위생")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 1


@pytest.mark.asyncio
async def test_get_improvement_task(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "품질",
        "task_description": "상세조회 과제",
    })
    task_id = create_resp.json()["id"]

    response = await supervisor_client.get(f"/v1/improvement-tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["task_description"] == "상세조회 과제"


@pytest.mark.asyncio
async def test_update_improvement_task(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "기타",
        "task_description": "수정전 과제",
    })
    task_id = create_resp.json()["id"]

    response = await supervisor_client.patch(f"/v1/improvement-tasks/{task_id}", json={
        "task_description": "수정후 과제",
        "priority": "높음",
    })
    assert response.status_code == 200
    assert response.json()["task_description"] == "수정후 과제"
    assert response.json()["priority"] == "높음"


@pytest.mark.asyncio
async def test_update_task_status(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "위생",
        "task_description": "상태변경 과제",
    })
    task_id = create_resp.json()["id"]

    response = await supervisor_client.patch(f"/v1/improvement-tasks/{task_id}/status", json={
        "status": "완료",
    })
    assert response.status_code == 200
    assert response.json()["status"] == "완료"


@pytest.mark.asyncio
async def test_delete_improvement_task(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/improvement-tasks/", json={
        "store_id": store_id,
        "category": "운영",
        "task_description": "삭제대상 과제",
    })
    task_id = create_resp.json()["id"]

    response = await supervisor_client.delete(f"/v1/improvement-tasks/{task_id}")
    assert response.status_code == 200

    response = await supervisor_client.get(f"/v1/improvement-tasks/{task_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_tasks_from_inspection(supervisor_client: AsyncClient):
    """점검 결과로부터 AI 기반 개선 과제 생성 (모킹)."""
    store_id = await _create_store(supervisor_client)
    inspection_id = await _create_inspection(supervisor_client, store_id)

    mock_ai_response = [
        {"category": "품질", "task_description": "면 물붓기 시간 준수 교육", "priority": "높음"},
        {"category": "위생", "task_description": "주방 바닥 청소 강화", "priority": "높음"},
    ]

    with patch("app.utils.ai.call_claude_json", return_value=mock_ai_response):
        with patch("app.services.claude_token_service.get_valid_access_token", return_value="mock-token"):
            response = await supervisor_client.post(
                f"/v1/inspections/{inspection_id}/generate-tasks"
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data["tasks"]) == 2
    assert data["tasks"][0]["category"] == "품질"
    assert data["tasks"][1]["category"] == "위생"

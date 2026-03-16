import math
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel

from app.config import settings

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    count: int
    total_cnt: int
    page_cnt: int
    cur_page: int
    next_page: Optional[int] = None
    previous_page: Optional[int] = None
    results: List[T]  # type: ignore[valid-type]


def paginate(items: list, page: int = 1, per_page: int | None = None) -> PaginatedResponse:
    if per_page is None:
        per_page = settings.PAGINATION_PER_PAGE

    total_cnt = len(items)
    page_cnt = math.ceil(total_cnt / per_page) if per_page > 0 else 1
    start = (page - 1) * per_page
    end = start + per_page
    results = items[start:end]

    return PaginatedResponse(
        count=len(results),
        total_cnt=total_cnt,
        page_cnt=page_cnt,
        cur_page=page,
        next_page=page + 1 if page < page_cnt else None,
        previous_page=page - 1 if page > 1 else None,
        results=results,
    )

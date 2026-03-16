from pydantic import BaseModel


class SuccessOut(BaseModel):
    detail: str

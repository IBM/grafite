from pydantic import BaseModel, ConfigDict
from typing import Literal


class Log(BaseModel):
    model_config  = ConfigDict(protected_namespaces=())

    timestamp: str
    user: str
    payload: dict | None
    method: Literal['PUT', 'POST', 'DELETE', 'PATCH']
    target_url: str
    table: str
    item_id: str | None

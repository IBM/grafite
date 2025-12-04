from pydantic import BaseModel
from typing import Optional


class Label(BaseModel):
    tag: Optional[list[str]] = None
    resolution: Optional[list[str]] = None

class SettingLabels(BaseModel):
    issue: Label
    test: Label

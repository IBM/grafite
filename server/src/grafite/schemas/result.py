from typing import Literal

from pydantic import BaseModel

class AddAnnotation(BaseModel):
    test_id: str
    annotation: str
    score: Literal[0, 1]
from pydantic import BaseModel, RootModel,  model_validator
from typing import Any

class SingleFieldBody(RootModel[dict[str, Any]]):
    @model_validator(mode='before')
    def check_single_key(cls, values):
        if not isinstance(values, dict):
            raise ValueError("Body must be a JSON object")
        if len(values) != 1:
            raise ValueError("Body must contain exactly one key")
        return values
 
    
class Comment(BaseModel):
    text: str
    created_time: str 
    last_updated_time: str | None
    author: str
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal, Union


class Run(BaseModel):
    model_config  = ConfigDict(protected_namespaces=())

    user:str
    model_id:str
    tests: Optional[Union[Literal["*"], list[str]]] = "*"
    params: Optional[dict] = None
    number_of_tests: Optional[int] = None

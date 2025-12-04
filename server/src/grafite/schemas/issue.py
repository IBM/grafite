from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from grafite.schemas.common import Comment

class Source(BaseModel):
    type: Literal['general', 'github']
    value: str

class Triage(BaseModel):
    ready_for_review: bool
    approved: bool
    resolved: Optional[bool] = None
    resolution: Optional[list[str]] = []
    note: Optional[str] = None


class BaseIssue(BaseModel):
    model_config  = ConfigDict(protected_namespaces=())
    
    title : str
    description : Optional[str] = None
    authors: list[str]
    triage: Triage
    active: bool
    
    tags : Optional[list[str]] = []
    feedback_ids : Optional[list[str]] = []
    test_ids : Optional[list[str]] = []
    
    sources: Optional[list[Source]] = []
    comments: Optional[list[Comment]] = []


class CreateIssue(BaseIssue):
    pass

class UpdateIssue(BaseIssue):
    tags : list[str]
    feedback_ids : list[str]
    test_ids : list[str]

import os

# load environment
from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict
from typing import Optional
from grafite.schemas.common import Comment

class BaseModelConfig(BaseModel):
    model_config  = ConfigDict(protected_namespaces=())

class Comment(BaseModelConfig):
    author: str
    comment: str

class Triage(BaseModelConfig):
    emails: Optional[list[str]] = None
    comments: Optional[list[Comment]] = None

class Feedback(BaseModelConfig):
    source:str
    model_id:str
    revision:Optional[str] = None
    tags:Optional[list[str]] = []
    recommended_fix:Optional[str] = None
    raw_feedback: dict = {}
    triage: Optional[Triage] = None
    comments: Optional[list[Comment]] = []
    

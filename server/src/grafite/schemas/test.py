from pydantic import BaseModel, ConfigDict
from typing import Optional, Union, Literal
from grafite.schemas.common import Comment
from grafite.validators.llmjudge.judge import get_template as get_judge_template

class Triage(BaseModel):
    ready_for_review: bool
    approved: bool

class Validator(BaseModel):
    type: str #llmjudge,rouge,bleu...
    parameters: dict
    
    def model_post_init(self, __context):
        if self.type == "llmjudge":
            self.parameters['judge_template'] = get_judge_template(judge_type=self.parameters.get('judge_type'))


class BaseTest(BaseModel):
    model_config  = ConfigDict(protected_namespaces=())
    
    issue_id:str 
    author: str
    prompt: Optional[str] = None
    messages: Optional[list[dict]] = []
    tools: Optional[list[dict]] = None
    sample_output: Optional[str] = None
    desired_output: Optional[str] = None
    desired_output_source: Optional[Union[Literal['human'],Literal['model']]] = None
    validators: Optional[list[Validator]] = []
    flags: Optional[list[str]] = []
    triage: Triage
    active: Optional[bool] = True
    comments: Optional[list[Comment]] = []

class CreateTest(BaseTest):
  pass

class UpdateTest(BaseTest):
    messages: list[dict]
    validators: list[Validator]
    flags: list[str]
    active: bool
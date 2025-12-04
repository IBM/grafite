from typing import Literal, Any
from typing_extensions import Self
from grafite.constants import DEFAULT_JUDGE_GUIDELINE

from pydantic import BaseModel, model_validator

ModelSource = Literal["watsonx", "ollama"]

class Parameters(BaseModel):
    temperature: float = 0
    top_p: float = 1
    top_k: int = 50
    frequency_penalty: float = 0
    presence_penalty: float = 0
    repetition_penalty: float = 1
    max_new_tokens: int = 1024
    additional_params: dict[str, Any] = {}
    thinking: bool = None

class Judge(BaseModel):
    source: ModelSource
    model_id: str 
    parameters: Parameters = Parameters()

class JudgeResponse(BaseModel):
    test_score: Literal[0, 1]
    test_justification: str
    model_id: str
    
class Credentials(BaseModel):
    watsonx_api_key: str | None = None
    watsonx_project_id: str | None = None

class TestInput(BaseModel):
    test_id: str | None = None
    prompt: str | None = None
    messages: list[dict] | None = None
    tools: list[dict] | None = None
    judge_template: str | None = None
    judge_guidelines: str | None = None
    ground_truth: str | None = None
    
    @model_validator(mode='after')
    def check_fields(self) -> Self:
        if not self.judge_guidelines or self.judge_guidelines == '':
            self.judge_guidelines = DEFAULT_JUDGE_GUIDELINE
        return self

class TestResult(BaseModel):
    test_id: str 
    judge_prompt: str | None = None
    judge_guidelines: str | None = None
    prompt_text: str | None = None
    messages: list[dict] | None = None
    ground_truth: str | None = None
    model_response: str | None = None
    judge_results: list[JudgeResponse]

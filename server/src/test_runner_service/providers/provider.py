from test_runner_service.schemas import Judge, JudgeResponse, TestResult, Parameters
from test_runner_service.utils import get_judge_prompt, post_process_judge_response, judge_response_format
from grafite.constants import JUDGE_SYSTEM_PROMPT

# Providers bury the server-side rejection message in the exception text,
# so detection is a conservative substring match rather than a typed error class.
_RESPONSE_FORMAT_ERROR_MARKERS = (
    "response_format", "json_schema", "guided_decoding",
    "structured output", "structured_outputs",
)

def is_response_format_unsupported(error: Exception) -> bool:
    msg = str(error).lower()
    return any(marker in msg for marker in _RESPONSE_FORMAT_ERROR_MARKERS)

class Provider:
    def chat(self, model_id: str, messages: list[dict], parameters: Parameters, tools: dict | None = None, *, response_format: dict | None = None) -> dict:
        raise NotImplementedError()

    def completions(self, model_id: str, prompt: str, parameters: Parameters) -> str:
        raise NotImplementedError()

    def judge(self, judge: Judge, result: TestResult, parameters: Parameters | dict) -> JudgeResponse:
        prompt = get_judge_prompt(result=result)
        messages = [{ "role": "user", "content": prompt }]

        if JUDGE_SYSTEM_PROMPT:
            messages = [{ "role": "system", "content":JUDGE_SYSTEM_PROMPT}] + messages

        judge_response = self.chat(
            model_id=judge.model_id,
            messages=messages,
            parameters=parameters,
            response_format=judge_response_format()
        )


        return post_process_judge_response(judge_response['content'] if 'content' in judge_response else '', model_id=judge.model_id)
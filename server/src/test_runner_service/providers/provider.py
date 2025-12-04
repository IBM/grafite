from test_runner_service.schemas import Judge, JudgeResponse, TestResult, Parameters
from test_runner_service.utils import get_judge_prompt, post_process_judge_response
from grafite.constants import JUDGE_SYSTEM_PROMPT

class Provider:
    def chat(self, model_id: str, messages: list[dict], parameters: Parameters, tools: dict | None = None) -> dict:
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
            parameters=parameters
        )

        
        return post_process_judge_response(judge_response['content'] if 'content' in judge_response else '', model_id=judge.model_id)
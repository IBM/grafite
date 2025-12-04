import re
import json
import logging
from datetime import datetime, timezone

from test_runner_service.schemas import TestResult, JudgeResponse

def extract_json_object(input_string):
    # Remove markdown code block markers (```json or ```)
    # Handle both single-line and multi-line code blocks
    if "```" in input_string:
        input_string = re.sub(r"^```(?:json|JSON)?\s*\n?", "", input_string, flags=re.MULTILINE)
        input_string = re.sub(r"\n?```\s*$", "", input_string, flags=re.MULTILINE)
        input_string = input_string.strip()

    try:
        parsed = json.loads(input_string)
        if "justification" in parsed and "score" in parsed:
            return input_string
    except json.JSONDecodeError:
        pass

    # If that fails, try to find JSON object with justification and score using regex
    # This pattern looks for a JSON object, handling escaped quotes and nested content
    # Search for opening matching brace, then any content until finds both justification and score keys

    # pattern = r'\{.*?"justification":\s*"[^"]*",\s*"score":\s*\d+[^\}]*\}'
    pattern = r'\{(?:[^{}]|(?:\{[^{}]*\}))*"justification"\s*:\s*"(?:[^"\\]|\\.)*"\s*,\s*"score"\s*:\s*\d+(?:[^{}]|(?:\{[^{}]*\}))*\}'

    matches = re.findall(pattern, input_string, re.DOTALL | re.IGNORECASE)

    if matches:
        for match in matches:
            try:
                parsed = json.loads(match)
                if "justification" in parsed and "score" in parsed:
                    return match
            except json.JSONDecodeError:
                continue

    return input_string

def post_process_judge_response(resp_str: str, model_id: str):
    resp_dict_str = extract_json_object(resp_str.strip())
    
    try:
        resp_dict = json.loads(resp_dict_str.strip())
        score = resp_dict["score"]
        justification = resp_dict["justification"]
    except Exception as e:
        score = 0
        justification = (
            f'Parsing error in the judge response string "{resp_str}".\nError "{e}"'
        )

    return JudgeResponse(test_score=score, test_justification=justification, model_id=model_id)

def get_judge_prompt(result: TestResult) -> str:
    judge_prompt = str(result.judge_prompt)

    result_as_dict = result.model_dump()
    for td_k, td_v in result_as_dict.items():
        inp_key = "{{" + td_k + "}}"
        if inp_key in judge_prompt:
            if td_k == 'prompt_text' and not result.prompt_text:
                continue

            judge_prompt = judge_prompt.replace(inp_key, str(td_v))
        if td_k == 'messages' and not result.prompt_text:
            prompt_from_messages = "\n".join(
                f"{m['role']}: {m['content']}" for m in result.messages
            )
            
            judge_prompt = judge_prompt.replace('{{prompt_text}}', prompt_from_messages)

    return judge_prompt

def get_current_iso_string() -> str:
    current_utc_datetime = datetime.now(timezone.utc)

    return current_utc_datetime.isoformat()

LOG_FORMATTER = logging.Formatter(
    fmt="%(asctime)s,%(msecs)03d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%d:%H:%M:%S",
)

logger = logging.getLogger("test-runner-service")

logger.setLevel(level="INFO")

_stream_handler = logging.StreamHandler()

_stream_handler.setFormatter(LOG_FORMATTER)
logger.addHandler(_stream_handler)
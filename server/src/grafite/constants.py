import os
from dotenv import load_dotenv
load_dotenv()

DEFAULT_JUDGE_GUIDELINE = "Model output should be well aligned with the ground truth text."

WX_API_KEY = os.getenv('WATSONX_API_KEY', '')
WX_PROJECT_ID = os.getenv('WATSONX_PROJECT_ID', '')
JUDGE_SYSTEM_PROMPT = os.getenv('JUDGE_SYSTEM_PROMPT', None)
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434/v1')
DEFAULT_OLLAMA_JUDGE_MODEL = os.getenv('DEFAULT_OLLAMA_JUDGE_MODEL', 'llama3.3')
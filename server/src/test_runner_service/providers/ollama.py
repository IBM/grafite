from time import sleep

from openai import OpenAI

from test_runner_service.schemas import Parameters
from test_runner_service.utils import logger
from test_runner_service.constants import MAX_RETRY_ATTEMPS, RETRY_TIME
from grafite.constants import OLLAMA_BASE_URL

from .provider import Provider

class OllamaProvider(Provider):
    def __init__(self):
        self.__current_retry_attempts = 0

    def chat(self, model_id: str, messages: list[dict], parameters: Parameters, tools: dict | None = None):
        try:
            client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="ollama")

            body_params = {
                **parameters.additional_params,
                'max_tokens': parameters.max_tokens,
                'temperature': parameters.temperature,
                'top_p': parameters.top_p,
                'frequency_penalty': parameters.frequency_penalty,
                'presence_penalty': parameters.presence_penalty,
            }
            logger.info(f"Ollama extra_body: {body_params}")

            res = client.chat.completions.create(
                model=model_id,
                messages=messages,
                tools=tools,
                tool_choice="auto" if tools is not None else "none",
                extra_headers={
                    "Content-Type": "application/json"
                },
                extra_body=body_params
            )

            return res.choices[0].message.model_dump()
        except Exception as e:
            self.__current_retry_attempts += 1

            if self.__current_retry_attempts > MAX_RETRY_ATTEMPS:
                err_message = f"Max number of retries ({MAX_RETRY_ATTEMPS}) exceeded. Error:\nFailed to generate model response: " + str(e)
                logger.error(err_message)
                raise Exception(err_message)
        
            logger.error("Failed to generate model response: " + str(e))
            logger.info(f"Retrying in {RETRY_TIME} seconds...")
            sleep(RETRY_TIME)

            return self.chat(model_id=model_id, messages=messages, tools=tools, parameters=parameters)

    def completions(self, model_id: str, prompt: str, parameters: Parameters):
        try:
            client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="ollama")

            body_params = {
                **parameters.additional_params,
                'max_tokens': parameters.max_tokens,
                'temperature': parameters.temperature,
                'top_p': parameters.top_p,
                'frequency_penalty': parameters.frequency_penalty,
                'presence_penalty': parameters.presence_penalty,
            }
            logger.info(f"Ollama extra_body: {body_params}")

            res = client.completions.create(
                model=model_id,
                prompt=prompt,
                extra_headers={
                    "Content-Type": "application/json"
                },
                extra_body=body_params
            )

            return res.choices[0].text
        except Exception as e:
            self.__current_retry_attempts += 1

            if self.__current_retry_attempts > MAX_RETRY_ATTEMPS:
                err_message = f"Max number of retries ({MAX_RETRY_ATTEMPS}) exceeded. Error:\nFailed to generate model response: " + str(e)
                logger.error(err_message)
                raise Exception(err_message)
        
            logger.error("Failed to generate model response: " + str(e))
            logger.info(f"Retrying in {RETRY_TIME} seconds...")
            sleep(RETRY_TIME)

            return self.completions(model_id=model_id, prompt=prompt, parameters=parameters)








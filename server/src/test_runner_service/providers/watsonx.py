from time import sleep

from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.foundation_models.schema import TextChatParameters, TextGenParameters
from ibm_watsonx_ai import Credentials as WXCredentials

from test_runner_service.schemas import Parameters
from test_runner_service.utils import logger
from test_runner_service.constants import MAX_RETRY_ATTEMPS, RETRY_TIME

from .provider import Provider

ACCESS_TOKEN_URL="https://iam.cloud.ibm.com/identity/token"
WX_URL="https://us-south.ml.cloud.ibm.com/"

class WatsonXProvider(Provider):
    __project_id: str
    __current_retry_attempts: int
    __credentials: WXCredentials

    def __init__(self, api_key: str, project_id: str):
        self.__project_id = project_id
        self.__current_retry_attempts = 0

        self.__credentials = WXCredentials(
            url=WX_URL,
            api_key=api_key
        )
    
    def chat(self, model_id: str, messages: list[dict], parameters: Parameters | dict, tools: dict | None = None):
        try:
            model = ModelInference(
                model_id=model_id,
                credentials=self.__credentials,
                project_id=self.__project_id,
            )

            res = model.chat(
                messages=messages,
                tools=tools,
                tool_choice_option="auto" if tools is not None else "none",
                params=self._convert_parameters_to_chat_parameters(parameters=parameters)
            )

            return res['choices'][0]['message']
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

    def completions(self, model_id: str, prompt: str, parameters: Parameters | dict) -> str:
        try:
            model = ModelInference(
                model_id=model_id,
                credentials=self.__credentials,
                project_id=self.__project_id,
            )

            res = model.generate(
                prompt=prompt,
                params=self._convert_parameters_to_completion_parameters(parameters=parameters)         
            )

            return res['results'][0]['generated_text']
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

    def _convert_parameters_to_chat_parameters(self, parameters: Parameters | dict) -> TextChatParameters:
        if isinstance(parameters, dict):
            return parameters
        
        default_params = TextChatParameters(
            temperature=parameters.temperature,
            top_p=parameters.top_p,
            max_tokens=parameters.max_new_tokens,
            frequency_penalty=parameters.frequency_penalty,
            presence_penalty=parameters.presence_penalty
        ).to_dict()

        return { **default_params, **parameters.additional_params }
    
    def _convert_parameters_to_completion_parameters(self, parameters: Parameters | dict) -> TextChatParameters:
        if isinstance(parameters, dict):
            return parameters
        
        default_params = TextGenParameters(
            temperature=parameters.temperature,
            top_p=parameters.top_p,
            repetition_penalty=parameters.repetition_penalty,
            top_k=parameters.top_k,
            max_new_tokens=parameters.max_new_tokens
        ).to_dict()

        return { **default_params, **parameters.additional_params }








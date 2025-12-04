import json
import os
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial
from copy import deepcopy

from test_runner_service.schemas import ModelSource, Credentials, Judge, TestResult, TestInput, Parameters, JudgeResponse
from test_runner_service.providers.provider_factory import ProviderFactory
from test_runner_service.providers.provider import Provider
from test_runner_service.utils import logger, LOG_FORMATTER, get_current_iso_string
from test_runner_service.constants import MAX_WORKERS

class TestRunnerService:
    __model_id: str
    __source: ModelSource
    __tests: list[TestInput]
    __judges: list[Judge]
    __parameters: Parameters
    __credentials: Credentials

    def __init__(
        self, 
        source: ModelSource,
        model_id: str,
        credentials: Credentials,
        tests: list[TestInput],
        judges: list[Judge] = [],
        parameters: Parameters = Parameters(),
        logs_dir_path: str | None = None
    ):    
        has_wx_judge = False
        for j in judges:
            if j.source == 'watsonx':
                has_wx_judge = True

        if (source == 'watsonx' or has_wx_judge) and (credentials.watsonx_api_key is None or credentials.watsonx_project_id is None):
            raise Exception("If source is 'watsonx', 'credentials.watsonx_api_key' and 'credentials.watsonx_project_id' are required")
        
        if logs_dir_path is not None and not os.path.isdir(logs_dir_path):
            raise Exception("Invalid 'logs_dir_path'. Path does not exist")
         
        self.__model_id = model_id
        self.__source = source
        self.__tests = deepcopy(tests)
        self.__judges = judges
        self.__parameters = parameters
        self.__credentials = credentials

        if logs_dir_path is not None:
            file_handler = logging.FileHandler(f'{logs_dir_path}/{get_current_iso_string()}-test-runner-service.log', mode='a')
            file_handler.setFormatter(LOG_FORMATTER)
            logger.addHandler(file_handler)

    def _generate_response(self, test: TestInput, provider: Provider) -> TestResult:
        logger.info(f"Generating model response for test '{test.test_id}'.")

        model_response = ''

        if test.messages is not None and len(test.messages) > 0:
            try:
                model_response = provider.chat(model_id=self.__model_id, messages=test.messages, tools=test.tools, parameters=self.__parameters)

                has_valid_content = 'content' in model_response and model_response['content'] is not None
                has_valid_tool_calls = 'tool_calls' in model_response and model_response['tool_calls'] is not None
                
                
                if has_valid_content:
                    model_response = model_response['content']
                elif has_valid_tool_calls :
                    model_response = json.dumps(model_response['tool_calls'])
                else :
                    model_response = ''
                    

            except Exception as e:
                model_response = str(e)
                
        elif test.prompt:
            logger.warning(f"Test '{test.test_id}' messages array is empty. Trying to use prompt.")
            
            try:
                model_response = provider.completions(model_id=self.__model_id, model_inference_url=self.__model_inference_url, prompt=test.prompt, parameters=self.__parameters)
            except Exception as e:
                model_response = str(e)
        else:
            logger.warning(f"Test '{test.test_id}' does not have messages nor prompt.")
            model_response = 'Error: Test does not have messages nor prompt'


        return TestResult(
            prompt_text=test.prompt, 
            messages=test.messages,
            judge_prompt=test.judge_template, 
            judge_guidelines=test.judge_guidelines or '',
            ground_truth=test.ground_truth,
            model_response=model_response,
            test_id=test.test_id,
            judge_results=[]
        )
    
    def _judge_response(self, result: TestResult, providers: list[Provider], judges: list[Judge]) -> TestResult:
        results = []

        for i, provider in enumerate(providers):
            judge = judges[i]
            logger.info(f"Generating '{judge.model_id}' judge evaluation for test '{result.test_id}'.")

            try:
                judge_response = provider.judge(judge=judge, result=result, parameters=judge.parameters)
            except Exception as e:
                judge_response = JudgeResponse(test_score=0, test_justification=str(e), model_id=judge.model_id)

            logger.info(f"Generated '{judge.model_id}' judge evaluation for test '{result.test_id}'.")

            results.append(judge_response)
        
        result.judge_results = results

        return result
    
    def details(self):
        return {
            'model_id': self.__model_id,
            'judge_model_ids': [j.model_id for j in self.__judges],
            'source': self.__source
        }
    
    def run(self):
        provider: Provider = ProviderFactory.create(source=self.__source, credentials=self.__credentials)

        results: list[TestResult] = []

        worker = partial(self._generate_response, provider=provider)

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(worker, item) for item in self.__tests]

            for future in as_completed(futures):
                result = future.result()
                results.append(result)

                logger.info(f"Generated model response for test '{result.test_id}'. ({len(results)}/{len(self.__tests)})")

        if len(self.__judges) > 0:
            judged_results: list[TestResult] = []

            judge_providers: list[Provider] = [ProviderFactory.create(source=judge.source, credentials=self.__credentials) for judge in self.__judges]

            worker = partial(self._judge_response, providers=judge_providers, judges=self.__judges)

            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                futures = [executor.submit(worker, item) for item in results]

                for future in as_completed(futures):
                    judge_result = future.result()
                    judged_results.append(judge_result)

                    logger.info(f"Generated judge evaluation(s) for test '{judge_result.test_id}'. ({len(judged_results)}/{len(self.__tests)})")
        
        return judged_results if len(self.__judges) > 0 else results


        
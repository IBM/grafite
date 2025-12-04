import os
import json
from typing import Union, Literal
from datetime import datetime, timezone
from test_runner_service import TestRunnerService, Parameters
from grafite.db.mongodb import Mongo
from grafite.constants import JUDGE_SYSTEM_PROMPT


class TestRunnerWrapper:
    run_id: str
    __created_at: str
    __creator:str
    __tests: Union[list[str], Literal["*"]]
    __test_runner: TestRunnerService
    __number_of_tests: int
    __run_params: Union[dict, Parameters]
    
    
    def __init__(
        self,
        creator: str,
        db: Mongo,
        test_runner: TestRunnerService,
        number_of_tests: int,
        run_params: dict,
        tests: Union[list[str], Literal["*"]] = "*",
    ):
        now = datetime.now(timezone.utc)
        date = now.strftime("%Y%m%d%H%M%S")
        
        self.__created_at = now.strftime('%Y-%m-%d %H:%M')
        self.run_id = f'run_{date}'
        self.__creator = creator
        self.__tests = tests
        self.__test_runner = test_runner
        self.__number_of_tests = number_of_tests
        self.__run_params = run_params
        self.db = db
        
        self.__run_params['additional_judge_system_prompt'] = JUDGE_SYSTEM_PROMPT
        
    def get_details(self):
        run_details = {
            "run_id": self.run_id,
            "creator": self.__creator,
            "tests": self.__tests,
            **(self.__test_runner.details()),
            "number_of_tests": self.__number_of_tests,
            "created_at": self.__created_at,
            "config": self.__run_params
        }

        return run_details
    
    def execute_tests(self):        
        results = [r.model_dump() for r in self.__test_runner.run()]

        return results
    
    
    def load_to_db(self, results: list[dict]):
        try:
            self.db.save_new_collection(self.run_id, results)
        except Exception as e:
            print(str(e))
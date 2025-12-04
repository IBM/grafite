import sys
import threading
import json
import os
from typing import Union
from datetime import datetime, timezone
from grafite.messaging.rabbit import Rabbit
import functools
from dotenv import load_dotenv
from test_runner_service import TestRunnerService, Credentials, TestInput, Judge, Parameters
from test_runner_service.test_runner_wrapper import TestRunnerWrapper
from grafite.db.mongodb import Mongo
from grafite.schemas.log import Log
from grafite.constants import WX_API_KEY, WX_PROJECT_ID, DEFAULT_OLLAMA_JUDGE_MODEL

try:
    from rich import print
except:
    pass

def process_message(ch, method, properties, body, args):
    callback = args

    delivery_tag = method.delivery_tag

    t = threading.Thread(
        target=callback, args=(ch, delivery_tag, body)
    )

    print('Starting digit listener thread...')
    t.start()


def ack_message(ch, delivery_tag):
    if ch.is_open:
        print('Run processed, acknowledging.')
        ch.basic_ack(delivery_tag)
    else:
        print('ERROR Channel Closed when trying to Acknowledge')
        pass


def deep_get(d, path, default=None):
    for key in path:
        try:
            d = d[key]
        except (KeyError, IndexError, TypeError):
            return default
    return d or default

def get_test_objects(tests: Union[str, list], db:Mongo ):
    
    match = { "triage.approved": True, "active": True }
    
    if isinstance(tests, list) :
        match["_id"] = {'$in': db.convert_to_objectid(tests)}

    tests = db.test.get(
        match=match,
        fields={}
    )
    
    # filter out items where judge isn't valide for us
    tests = [
        t for t in tests 
        if len(t['validators']) > 0 and t['validators'][0]['parameters']['judge_type'] not in ['Custom script or program', None]
    ]
        
    test_list: list[TestInput] = [
        TestInput(
            ground_truth=deep_get(t, ['desired_output'], ''),
            judge_guidelines=deep_get(t, ['validators', 0, 'parameters', 'judge_guidelines'], ''),
            judge_template=deep_get(t, ['validators', 0, 'parameters', 'judge_template'], ''),
            messages=deep_get(t, ['messages'], None),
            prompt=deep_get(t, ['prompt'], None),
            test_id=str(t['_id']),
            tools=deep_get(t, ['tools'], None)
        ) for t in tests
    ]
    
    return test_list
    
    
    
def process_digit_run(channel, delivery_tag, body):
    print(f'Test Runner: processing run: {body}')
    db = Mongo()

    job_parameters:dict = json.loads(body)
    
    print("job_parameters", job_parameters)

    wrapper = None

    judges = [Judge(source="ollama", model_id=judge) for judge in job_parameters.get("judges", [])]

    if len(judges) == 0:
        judges = [Judge(source='ollama', model_id=DEFAULT_OLLAMA_JUDGE_MODEL)]

    try:
        run_params:Parameters = Parameters(**job_parameters.get("params",{}))
        print("run_params", run_params)
        
        # Get the tests
        tests = job_parameters.get('tests',"*")
        test_list = get_test_objects(tests=tests, db=db)
        
        test_runner = TestRunnerService( 
            source=job_parameters.get('source', 'ollama'),
            model_id=job_parameters.get('model', ''),
            credentials=Credentials(
                watsonx_api_key=job_parameters.get('WX_API_KEY', WX_API_KEY), 
                watsonx_project_id=job_parameters.get('WX_PROJECT_ID', WX_PROJECT_ID), 
            ),
            tests=test_list,
            judges=judges,
            parameters=run_params,
        )
        
        wrapper = TestRunnerWrapper(
            creator=job_parameters.get("user", ''),
            test_runner=test_runner,
            db=db,
            tests=tests,
            number_of_tests=len(test_list),
            run_params=run_params.model_dump()
        )
        
        # LOG # # # # # # # # # # # # # #
        log = Log(
            item_id=wrapper.run_id,
            method='POST',
            payload=job_parameters,
            table='run',
            target_url='digit_run',
            timestamp=datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S'),
            user=job_parameters.get('user','')
        )
        db.log.save([log])
        # # # # # # # # # # # # # # # # #
        
        START_TIME = datetime.now(timezone.utc)

        run_details = wrapper.get_details()

        run_details['status'] = 'started'

        db.run.save([run_details])

        # t.build_config()

        # t.build_test_from_task()

        db.run.update(filter={"run_id": wrapper.run_id}, element={"status": "in progress"})

        results = wrapper.execute_tests()

        wrapper.load_to_db(results=results)

        END_TIME = datetime.now(timezone.utc)

        db.run.update(
            filter={"run_id": wrapper.run_id},
            element={"status": "done", "elapsed_time": f'{(END_TIME - START_TIME).total_seconds()} seconds'}
        )
        
    except Exception as error:
        print(error)

        if wrapper is None:
            creator = "<unknown>"
            if 'user' in job_parameters:
                creator = job_parameters['user']

            model_id = "<unknown>"
            if 'model' in job_parameters:
                model_id = job_parameters['model']
            
            tests = "<unknown>"
            if 'tests' in job_parameters:
                tests = job_parameters.get('tests',"*")

            run_details = {
                "run_id": "<unknown",
                "creator": creator,
                "model_id": model_id,
                "tests": tests,
                "created_at": datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M'),
                "status": "failed",
                "error_msg": ""
            }

            run_details['error_msg'] = f'message payload: {job_parameters}\nexception: {str(error)}'

            db.run.save([run_details])
        else:
            db.run.update(filter={"run_id": wrapper.run_id}, element={"status": "failed", "error_msg": str(error)})
            wrapper.load_to_db()

    ack_callback = functools.partial(ack_message, channel, delivery_tag)

    channel.connection.add_callback_threadsafe(ack_callback)


def start_service_listener(
    queue_name: str = 'digit_run'
):
    print(f'Connecting to RabbitMQ queue: {queue_name}')

    rabbit_mq = Rabbit(queue_name)

    message_callback = functools.partial(process_message, args=(process_digit_run))

    rabbit_mq.consume_messages(message_callback)

    print('Waiting for messages. To exit press CTRL+C')

    try:
        rabbit_mq.start()
    except KeyboardInterrupt:
        rabbit_mq.stop()
        rabbit_mq.close()
    except Exception as error:
        print('Error', error, flush=True)
        sys.exit(-1)


if __name__ == '__main__':
    start_service_listener()

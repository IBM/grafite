import dataclasses
import json
import os
import ssl
import pika  # type: ignore
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(), override=True)


class Rabbit:
    def __init__(self, queue_name):
        self.rmq_host = os.environ['RABBITMQ_HOST']
        self.rmq_port = int(os.environ['RABBITMQ_PORT'])
        self.rmq_user = os.getenv('RABBITMQ_USER', None)
        self.rmq_pwd = os.getenv('RABBITMQ_PWD', None)
        self.rmq_ca_file = os.getenv('RABBITMQ_CA_FILE', None)
        self.rmq_queue_name = queue_name

        print('Connecting to RabbitMQ instance...')
        print(f'Queue: {self.rmq_queue_name} / TLS enabled: {self.rmq_ca_file is not None}')

        try:
            if self.rmq_ca_file is not None:
                if self.rmq_user is None or self.rmq_pwd is None:
                    raise Exception('RabbitMQ CA file defined but no username/password set!')

                context = ssl.create_default_context()
                context.load_verify_locations(cafile=self.rmq_ca_file)

                self.connection = pika.BlockingConnection(pika.ConnectionParameters(
                    host=self.rmq_host,
                    port=self.rmq_port,
                    credentials=pika.PlainCredentials(self.rmq_user, self.rmq_pwd),
                    ssl_options=pika.SSLOptions(context=context),
                    heartbeat=300
                ))
            elif self.rmq_user is None or self.rmq_pwd is None:
                self.connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host=self.rmq_host,
                        port=self.rmq_port,
                        heartbeat=300
                    )
                )
            else:
                self.connection = pika.BlockingConnection(pika.ConnectionParameters(
                    host=self.rmq_host,
                    port=self.rmq_port,
                    credentials=pika.PlainCredentials(self.rmq_user, self.rmq_pwd),
                    heartbeat=300
                ))

        except Exception as error:
            print(error, flush=True)
            raise Exception("Failed to connect to RabbitMQ service!")

        self.channel = self.connection.channel()

        self.channel.queue_declare(queue=self.rmq_queue_name, durable=True)

        self.channel.basic_qos(prefetch_count=1)

    def consume_messages(self, message_callback):
        if len(self.rmq_queue_name) == 0:
            raise Exception("Queue name not set!")

        self.channel.basic_consume(on_message_callback=message_callback,
                                   queue=self.rmq_queue_name)

    def publish_message(self, payload, as_dict=False):
        if len(self.rmq_queue_name) == 0:
            raise Exception("Queue name not set!")

        if not as_dict:
            self.channel.basic_publish(exchange='',
                                       routing_key=self.rmq_queue_name,
                                       body=json.dumps(payload))
        else:
            self.channel.basic_publish(exchange='',
                                       routing_key=self.rmq_queue_name,
                                       body=json.dumps(dataclasses.asdict(payload)))

    def start(self):
        self.channel.start_consuming()

    def stop(self):
        self.channel.stop_consuming()

    def close(self):
        self.connection.close()

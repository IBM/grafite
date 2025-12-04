import amqp from 'amqplib';
import { readFileSync } from 'fs';

const RABBITMQ_CA_FILE = process.env.RABBITMQ_CA_FILE;
const RABBITMQ_USER = process.env.RABBITMQ_USER;
const RABBITMQ_PWD = process.env.RABBITMQ_PWD;
const RABBITMQ_HOST = process.env.RABBITMQ_HOST;
const RABBITMQ_PORT = process.env.RABBITMQ_PORT;

export async function sendMessageToQueue(queue: string, payload: unknown, multiple: boolean = false) {
  try {
    let connection: amqp.ChannelModel;

    if (RABBITMQ_CA_FILE) {
      connection = await amqp.connect(
        {
          username: RABBITMQ_USER,
          hostname: RABBITMQ_HOST,
          password: RABBITMQ_PWD,
          port: Number(RABBITMQ_PORT),
          protocol: 'amqps',
        },
        {
          ca: [readFileSync(RABBITMQ_CA_FILE)],
        },
      );
    } else {
      connection = await amqp.connect({
        username: RABBITMQ_USER,
        hostname: RABBITMQ_HOST,
        password: RABBITMQ_PWD,
        port: Number(RABBITMQ_PORT),
        protocol: 'amqp',
      });
    }

    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });

    if (multiple) {
      (payload as unknown[]).forEach((m: unknown) => {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(m)));
      });
    } else {
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)));
    }

    await channel.close();
    await connection.close();

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

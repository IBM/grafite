import { getCurrentUserPermission } from '@utils/getCurrentUserPermission';
import { Permission } from '@utils/permission';
import { sendMessageToQueue } from '@utils/sendMessageToQueue';
import { NextRequest, NextResponse } from 'next/server';

import { Run, validateSchema } from './utils';

export async function GET() {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing test-running endpoint' },
        {
          status: 500,
        },
      );
    }

    const res = await fetch(`${process.env.MONGODB_SERVICE_URL}/api/run`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to get running tests' }, { status: res.status });
    }

    const runs: Run[] = await res.json();

    return NextResponse.json({ data: runs }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.RABBITMQ_HOST ||
      !process.env.RABBITMQ_PORT ||
      !process.env.RABBITMQ_USER ||
      !process.env.RABBITMQ_PWD
    ) {
      return NextResponse.json(
        { error: 'Missing test-running endpoint' },
        {
          status: 500,
        },
      );
    }

    const userPermissions = await getCurrentUserPermission();
    const isAdmin = userPermissions.includes(Permission.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        {
          status: 403,
        },
      );
    }

    const body = await req.json();

    validateSchema(body); //soft warning for wrong schema

    const params = body['parameters'];

    if (body['thinking']) {
      params['thinking'] = body['thinking'];
    }

    const payload = {
      user: body['user'],
      model: body['model_id'],
      tests: body['tests'],
      params: params,
      source: body['source'],
      judges: body['judges'],
    };

    const sentMessageSuccessfully = await sendMessageToQueue('digit_run', payload);

    if (!sentMessageSuccessfully)
      return NextResponse.json(
        { error: 'Something went wrong while sending data to digit_run queue' },
        { status: 500 },
      );

    return NextResponse.json({ data: 'Successfully started test running' }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { fetchWithEmailHeader } from '@utils/fetchWithEmailHeader';
import { NextRequest, NextResponse } from 'next/server';

import { Test } from '../utils';

export async function GET(req: NextRequest, { params }: { params: { id: string | undefined | null } }) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing tests endpoint' },
        {
          status: 500,
        },
      );
    }

    const { id } = params;

    const res = await fetch(`${process.env.MONGODB_SERVICE_URL}/api/test/${id}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to get test' }, { status: res.status });
    }

    const test: Test | null = await res.json();

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({ data: test }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string | undefined | null } }) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing tests endpoint' },
        {
          status: 500,
        },
      );
    }

    const body = await req.json();

    const { id } = params;

    const res = await fetchWithEmailHeader(`${process.env.MONGODB_SERVICE_URL}/api/test/${id}`, {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to update test' }, { status: res.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string | undefined | null } }) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing tests endpoint' },
        {
          status: 500,
        },
      );
    }

    const body = await req.json();

    const { id } = params;

    const res = await fetchWithEmailHeader(`${process.env.MONGODB_SERVICE_URL}/api/test/${id}`, {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to update test' }, { status: res.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

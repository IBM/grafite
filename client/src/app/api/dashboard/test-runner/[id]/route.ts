import { fetchWithEmailHeader } from '@utils/fetchWithEmailHeader';
import { NextRequest, NextResponse } from 'next/server';

import { Run } from '../utils';

export async function GET(req: NextRequest, { params }: { params: { id: string | undefined | null } }) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing test-running endpoint' },
        {
          status: 500,
        },
      );
    }

    const { id } = params;

    const res = await fetch(`${process.env.MONGODB_SERVICE_URL}/api/run/${id}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to get the running test detail' }, { status: res.status });
    }

    const run: Run | null = await res.json();

    if (!run) {
      return NextResponse.json({ error: 'Running test not found' }, { status: 404 });
    }

    return NextResponse.json({ data: run }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string | undefined | null } }) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing test-running endpoint' },
        {
          status: 500,
        },
      );
    }

    const { id } = params;

    const res = await fetchWithEmailHeader(`${process.env.MONGODB_SERVICE_URL}/api/run/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json();

      return NextResponse.json({ error: err.detail }, { status: res.status });
    }

    return new NextResponse(null, { status: res.status });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

import { Feedback } from '../utils';

export async function GET(req: NextRequest, { params }: { params: { id: string | undefined | null } }) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing feedbacks endpoint' },
        {
          status: 500,
        },
      );
    }

    const { id } = params;

    const res = await fetch(`${process.env.MONGODB_SERVICE_URL}/api/feedback/${id}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to get feedback' }, { status: res.status });
    }

    const feedback: Feedback | null = await res.json();

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({ data: feedback }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { fetchWithEmailHeader } from '@utils/fetchWithEmailHeader';
import { NextRequest, NextResponse } from 'next/server';

import { Feedback, validateSchema } from './utils';

export async function GET() {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing feedbacks endpoint' },
        {
          status: 500,
        },
      );
    }

    const res = await fetch(`${process.env.MONGODB_SERVICE_URL}/api/feedback`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to get feedbacks' }, { status: res.status });
    }

    const feedbacks: Feedback[] = await res.json();

    return NextResponse.json({ data: feedbacks }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing feedbacks endpoint' },
        {
          status: 500,
        },
      );
    }

    const body = await req.json();

    validateSchema(body); //soft warning for wrong schema

    const res = await fetchWithEmailHeader(`${process.env.MONGODB_SERVICE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: res.status });
    }

    const feedbackId = await res.text();

    return NextResponse.json({ data: feedbackId }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

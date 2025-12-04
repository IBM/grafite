import { fetchWithEmailHeader } from '@utils/fetchWithEmailHeader';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing settings endpoint' },
        {
          status: 500,
        },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const setting = searchParams.get('setting');

    if (!type || !setting)
      return NextResponse.json(
        { error: 'Missing required fields' },
        {
          status: 422,
        },
      );

    if (
      !['issue', 'test'].includes(type) ||
      !['tag', 'resolution'].includes(setting) ||
      (type === 'test' && setting === 'resolution')
    ) {
      return NextResponse.json(
        { error: 'Invalid field(s)' },
        {
          status: 422,
        },
      );
    }

    const res = await fetch(`${process.env.MONGODB_SERVICE_URL}/api/settings/${type}/${setting}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: res.status });
    }

    const settings = await res.json();

    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MONGODB_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Missing settings endpoint' },
        {
          status: 500,
        },
      );
    }

    const body = await req.json();

    if (!Object.hasOwn(body, 'type') || !Object.hasOwn(body, 'setting') || !Object.hasOwn(body, 'label'))
      return NextResponse.json(
        { error: 'Missing required fields' },
        {
          status: 422,
        },
      );

    if (
      !['issue', 'test'].includes(body['type'] as string) ||
      !['tag', 'resolution'].includes(body['setting'] as string) ||
      (body['type'] === 'test' && body['setting'] === 'resolution') ||
      typeof body['label'] !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid field(s)' },
        {
          status: 422,
        },
      );
    }

    const res = await fetchWithEmailHeader(
      `${process.env.MONGODB_SERVICE_URL}/api/settings/${body['type']}/${body['setting']}?label=${body['label']}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: res.status });
    }

    return NextResponse.json({ success: 'Successfully saved settings' }, { status: 200 });
  } catch (error) {
    console.error('Error: ', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
async function handler() {
  if (!process.env.WX_ENDPOINT || !process.env.WX_API_KEY) {
    return new Response(JSON.stringify({ success: null, error: { message: 'Missing WX_ENDPOINT or WX_API_KEY' } }), {
      status: 404,
    });
  }
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.append('apikey', process.env.WX_API_KEY);

    const tokenRes = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!tokenRes.ok) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Failed to post`,
          },
        }),
        { status: 401 },
      );
    }

    const { access_token } = await tokenRes.json();

    const res = await fetch(`${process.env.WX_ENDPOINT}/ml/v1/foundation_model_specs?version=2023-07-07`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      cache: 'no-store',
    });

    const list = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Failed to post`,
          },
        }),
        { status: 500 },
      );
    }

    const models = list?.resources?.map((d: { [key: string]: unknown }) => d.model_id);

    return new Response(
      JSON.stringify({
        success: { data: models },
      }),
    );
  } catch (e) {
    console.log('Error: ', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
export { handler as GET };

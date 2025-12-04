import { APICallError } from '@types';

export async function patchDashboardTest(testId: string, body: { key: string; value: unknown }): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_TEST_ENDPOINT}/${testId}` || '').replace(/(?<!:)\/\//g, '/'),
        {
          method: 'PATCH',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [body.key]: body.value }),
        },
      );

      if (!res.ok) {
        const data = await res.json();

        if (data.error) {
          reject(new APICallError(data.error, res.status, 'No test updated'));
        } else {
          reject(new APICallError('Failed to update test', res.status, res.body));
        }

        return;
      }

      resolve('Successfully updated issue');
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

import { Test } from '@api/dashboard/tests/utils';
import { APICallError } from '@types';

export async function postDashboardTest(body: Omit<Test, '_id'>): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_DASHBOARD_TEST_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'), {
        method: 'POST',
        headers: {
          accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'Could not create test'));
        } else {
          reject(new APICallError('Failed to create test', res.status, res.body));
        }

        return;
      }

      const id = data.data;

      resolve(id);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

import { StartRunBody } from '@api/dashboard/test-runner/utils';
import { APICallError } from '@types';

export async function postRunTest(body: StartRunBody): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_DASHBOARD_TEST_RUNNING_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'),
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'Could not run test'));
        } else {
          reject(new APICallError('Failed to run test', res.status, res.body));
        }

        return;
      }

      const success = data.data;

      resolve(success);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

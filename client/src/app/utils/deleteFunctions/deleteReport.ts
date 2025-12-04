import { APICallError } from '@types';

export async function deleteReport(runId: string): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DASHBOARD_TEST_RUNNING_ENDPOINT || ''}/${runId}`.replace(/(?<!:)\/\//g, '/'),
        {
          method: 'DELETE',
          headers: {
            accept: 'application/json',
          },
        },
      );

      if (!res.ok) {
        const data = await res.json();

        if (data.error) {
          reject(new APICallError(data.error, res.status, 'Could not delete report'));
        } else {
          reject(new APICallError('Failed to delete report', res.status, res.body));
        }

        return;
      }

      resolve(res.status);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

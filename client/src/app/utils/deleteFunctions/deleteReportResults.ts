import { APICallError } from '@types';

export async function deleteReportResults(runId: string): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DASHBOARD_RESULT_ENDPOINT || ''}/${runId}`.replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'Could not delete report results'));
        } else {
          reject(new APICallError('Failed to delete report results', res.status, res.body));
        }

        return;
      }

      resolve(res.status);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

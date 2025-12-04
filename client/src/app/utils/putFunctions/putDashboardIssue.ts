import { APICallError } from '@types';

export async function putDashboardIssue(issueId: string, body: unknown): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_ISSUE_ENDPOINT}/${issueId}` || '').replace(/(?<!:)\/\//g, '/'),
        {
          method: 'PUT',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json();

        if (data.error) {
          reject(new APICallError(data.error, res.status, 'No issue updated'));
        } else {
          reject(new APICallError('Failed to update issue', res.status, res.body));
        }

        return;
      }

      resolve('Successfully updated issue');
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

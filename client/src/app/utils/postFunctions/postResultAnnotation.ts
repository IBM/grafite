import { APICallError } from '@types';

export async function postResultAnnotation(
  runId: string,
  body: {
    test_id: string;
    score: number;
    annotation: string;
  },
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(`/api/dashboard/results/${runId}/annotation`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'Could not save human evaluation'));
        } else {
          reject(new APICallError('Failed to save human evaluation', res.status, res.body));
        }

        return;
      }

      const result = data.data;

      resolve(result);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

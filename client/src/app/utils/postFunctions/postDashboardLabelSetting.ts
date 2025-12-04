import { APICallError } from '@types';

export async function postDashboardLabelSetting(body: {
  type: 'test' | 'issue';
  setting: 'resolution' | 'tag';
  label: string;
}): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_SETTINGS_ENDPOINT}/labels` || '').replace(/(?<!:)\/\//g, '/'),
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'Could not add label'));
        } else {
          reject(new APICallError('Failed to add label', res.status, res.body));
        }

        return;
      }

      const message = data.success;

      resolve(message);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

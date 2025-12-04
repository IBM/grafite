import { APICallError } from '@types';

export async function getDashboardLabelSettings({
  type,
  setting,
}: {
  type: 'test' | 'issue';
  setting: 'resolution' | 'tag';
}): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_SETTINGS_ENDPOINT}/labels?type=${type}&setting=${setting}` || '').replace(
          /(?<!:)\/\//g,
          '/',
        ),
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'No settings returned'));
        } else {
          reject(new APICallError('Failed to get settings', res.status, res.body));
        }

        return;
      }

      const settings: string[] = data.data;

      resolve(settings);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

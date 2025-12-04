import { APICallError } from '@types';

export async function getWxModels(): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_WX_LIST_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'), {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.warn(res);

        reject(new APICallError('Failed to fetch', res.status, res.body));
      }

      const list = await res.json();
      //no need to throw error when the list is empty
      resolve(list.success?.data || []);
    } catch (e) {
      console.log('Error: ', e);
      reject(new APICallError('Something went wrong', 422, e));
    }
  });
}

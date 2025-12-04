import { APICallError } from '@types';

export type OllamaReqBody = {
  model: string;
  prompt: string;
  options: {
    temperature: number;
    top_p: number;
    top_k: number;
    repetition_penalty: number;
    num_predict: number;
  };
  stream: boolean;
};

export async function postOllamaFreeform(req: OllamaReqBody): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        console.warn(res);

        reject(new APICallError('Failed to fetch', res.status, res.body));
      }

      const result = await res.json();

      if (!!result) resolve(result.response);
      else reject(new APICallError('Something went wrong', 422, 'validation not returned'));
    } catch (e) {
      console.log('Error: ', e);
      reject(new APICallError('Something went wrong', 422, e));
    }
  });
}

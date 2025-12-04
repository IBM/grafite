import { Result as ServerSchema } from '@api/dashboard/results/utils';
import { APICallError } from '@types';

export type JudgeResult = {
  testScore: number;
  testJustification: string;
  modelId: string;
  type?: string;
};
export type Result = {
  testId: string;
  taskName: string;
  isSeed: boolean;
  testDescription: string;
  promptText: string;
  messages?: { role: string; content: string }[];
  judgePrompt: string;
  judgeGuidelines: string;
  groundTruth: string;
  modelResponse: string;
  judgeResults: JudgeResult[];
};

const mapResultstoClientSchema = (result: ServerSchema[]): Result[] => {
  return result.map((r) => ({
    testId: r.test_id.trim(),
    taskName: r.task_name,
    isSeed: r.is_seed,
    testDescription: r.test_description,
    promptText: r.prompt_text,
    messages: r.messages,
    judgePrompt: r.judge_prompt,
    judgeGuidelines: r.judge_guidelines,
    groundTruth: r.ground_truth,
    modelResponse: r.model_response,
    judgeResults: r.judge_results.map((j) => ({
      testScore: j.test_score,
      testJustification: j.test_justification,
      modelId: j.model_id,
      ...(j.type && { type: j.type }),
    })),
  }));
};

export async function getDashboardResult(runId: string): Promise<Result[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_RESULT_ENDPOINT}/${runId}` || '').replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'No result returned'));
        } else {
          reject(new APICallError('Failed to get result', res.status, res.body));
        }

        return;
      }

      const result: Result[] = mapResultstoClientSchema(data.data);

      resolve(result);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

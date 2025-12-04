import { Run as ServerSchema } from '@api/dashboard/test-runner/utils';
import { APICallError } from '@types';

export type TestRun = {
  id?: string;
  runId: string;
  creator: string;
  modelId: string;
  judgeModelId?: string;
  judgeModelIds?: string[];
  databuilder: string;
  createdAt: string;
  status: string;
  errorMsg?: string;
  number_of_tests?: number | null;
};

const mapTestRuntoClientSchema = (run: ServerSchema): TestRun => {
  return {
    id: run._id,
    runId: run.run_id.trim(),
    creator: run.creator,
    modelId: run.model_id,
    ...(run.judge_model_id && { judgeModelId: run.judge_model_id }),
    ...(run.judge_model_ids && { judgeModelIds: run.judge_model_ids }),
    databuilder: run.databuilder,
    createdAt: run.created_at,
    status: run.status,
    number_of_tests: run.number_of_tests,
    ...(run.error_msg && { errorMsg: run.error_msg }),
  };
};

export async function getDashboardRunningTests(): Promise<TestRun[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_DASHBOARD_TEST_RUNNING_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'No running tests returned'));
        } else {
          reject(new APICallError('Failed to get running tests', res.status, res.body));
        }

        return;
      }

      const runningTests: TestRun[] = data.data?.map((d: ServerSchema) => mapTestRuntoClientSchema(d));

      resolve(runningTests);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

export async function getDashboardRunningTest(runId: string): Promise<TestRun> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_TEST_RUNNING_ENDPOINT}/${runId}` || '').replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'No running test returned'));
        } else {
          reject(new APICallError('Failed to get running test', res.status, res.body));
        }

        return;
      }

      const runningTest: TestRun = mapTestRuntoClientSchema(data.data);

      resolve(runningTest);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

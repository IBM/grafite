import type { Test as ServerSchema } from '@api/dashboard/tests/utils';
import { APICallError, UserComment } from '@types';

type ValidatorLlmJudge = {
  judgeType: string;
  judgeTemplate: string;
  judgeGuidelines: string;
};

type Message = {
  role: string;
  content: string;
};

export type Test = {
  id?: string;
  issueId: string;
  author: string;
  prompt?: string | undefined;
  messages?: Message[] | undefined;
  tools?: object[] | undefined;
  sampleOutput?: string | undefined;
  desiredOutput?: string | undefined;
  desiredOutputSource?: 'human' | 'model' | undefined;
  validators?:
    | {
        type: string;
        parameters: ValidatorLlmJudge;
      }[]
    | undefined;
  flags?: string[] | undefined;
  approved: boolean;
  readyForReview: boolean;
  active: boolean;
  comments: UserComment[] | undefined;
  source_id?: string | null;
};

const mapTestToClientSchema = (data: ServerSchema): Test => {
  return {
    id: data._id ?? '',
    author: data.author,
    issueId: data.issue_id,
    prompt: data.prompt ?? undefined,
    messages: (data.messages as Message[]) ?? undefined,
    tools: data.tools ?? undefined,
    sampleOutput: data.sample_output ?? undefined,
    desiredOutput: data.desired_output ?? undefined,
    desiredOutputSource: data.desired_output_source ?? undefined,
    validators:
      data.validators?.map((v) => ({
        ...v,
        parameters: {
          judgeType: v.parameters.judge_type,
          judgeTemplate: v.parameters.judge_template,
          judgeGuidelines: v.parameters.judge_guidelines,
        },
      })) ?? undefined,
    flags: data.flags ?? undefined,
    readyForReview: data.triage.ready_for_review,
    approved: data.triage.approved,
    comments: data.comments,
    active: data.active,
    source_id: data?.source_id || null,
  };
};

export async function getDashboardTests(): Promise<Test[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_DASHBOARD_TEST_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'No tests returned'));
        } else {
          reject(new APICallError('Failed to get dashboard tests', res.status, res.body));
        }

        return;
      }

      const tests: Test[] = data.data.map((d: ServerSchema) => mapTestToClientSchema(d));

      resolve(tests);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

export async function getDashboardTest(testId: string): Promise<Test> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_TEST_ENDPOINT}/${testId}` || '').replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'No test returned'));
        } else {
          reject(new APICallError('Failed to get dashboard test', res.status, res.body));
        }

        return;
      }

      const test: Test = mapTestToClientSchema(data.data);

      resolve(test);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

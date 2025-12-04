import type { UserComment } from '@types';

type ValidatorLlmJudge = {
  judge_type: string;
  judge_template: string;
  judge_guidelines: string;
};

type Validator = {
  type: string;
  parameters: ValidatorLlmJudge;
};

type Triage = {
  ready_for_review: boolean;
  approved: boolean;
};

export type Test = {
  _id?: string;
  issue_id: string;
  author: string;
  prompt?: string | null;
  messages?: object[] | null;
  tools?: object[] | null;
  sample_output?: string | null;
  desired_output?: string | null;
  desired_output_source?: 'human' | 'model' | null;
  validators?: Validator[] | null;
  flags?: string[] | null;
  triage: Triage;
  active: boolean;
  comments?: UserComment[];
  source_id?: string | null;
};

export enum DesiredOutputSourceType {
  MODEL = 'model',
  HUMAN = 'human',
}

export function validateSchema(data: unknown): data is Test {
  if (typeof data !== 'object' || !data) {
    console.warn('Invalid data passed');
    return false;
  }
  const keys = Object.keys(data);

  const testSchemaKeys = [
    'issue_id',
    'author',
    'prompt',
    'messages',
    'tools',
    'sample_output',
    'desired_output',
    'desired_output_source',
    'validators',
    'flags',
    'triage',
    'active',
  ];

  for (const key of keys) {
    if (!testSchemaKeys.includes(key)) {
      console.warn(key + ' is not part of the schema');
      return false;
    }
  }
  return true;
}

import { type Test as ServerSchema } from '@api/dashboard/tests/utils';
import { type Validator } from '@components/SelectedIssueContext';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { getDashboardTest, Test } from '@utils/getFunctions/getDashboardTests';
import { getEnumKeyByValue, JudgeTypes } from '@utils/keyMappings';
import { parseToolCall } from '@utils/parseToolCall';

import judgePrompts from './prompts';

export const judgeTypeNames: Array<keyof typeof JudgeTypes> = Object.keys(JudgeTypes) as Array<keyof typeof JudgeTypes>;
export const judgeTypes = Object.fromEntries(judgePrompts.map((prompt, i) => [judgeTypeNames[i], prompt]));

export type ValidationData = {
  score: number | null | string;
  justification: string;
};

export type TestTableData = ValidationData & {
  isSelected: boolean;
  id: string;
  prompt: string;
  sampleOutput: string;
  desiredOutput: string;
};

export const processJudgePrompt = (
  bakedPrompt: string,
  testInfo: Test | TestTableData,
  judgeType: keyof typeof JudgeTypes,
  guidelines?: string,
) => {
  const key = getEnumKeyByValue(JudgeTypes, judgeType);
  if (key) {
    let prompt = judgeTypes[key];

    prompt = prompt.replace('{{prompt_text}}', bakedPrompt || '');
    prompt = prompt.replace('{{model_response}}', testInfo.sampleOutput || '');
    prompt = prompt.replace('{{ground_truth}}', testInfo.desiredOutput || '');
    // @ts-expect-error when guideline is not given there's always guideline from the test info
    prompt = prompt.replace('{{judge_guidelines}}', (guidelines ? guidelines : testInfo.judgeGuideline) ?? '');
    return prompt;
  }
  return '';
};

export const getJudgeValues = (d: Test) => {
  const judgeSettings = d.validators?.[0]?.parameters;
  if (!judgeSettings) return undefined;
  return {
    judgeType: judgeSettings.judgeType,
    judgeGuidelines: judgeSettings.judgeGuidelines,
    judgeTemplate: judgeSettings.judgeTemplate,
  };
};

export const mapClientToServerSchema = (test: Test, issueId: string, email: string) => {
  const judgeInfo = test.validators?.[0]?.parameters;
  const serverSchema: Omit<ServerSchema, '_id'> = {
    active: true,
    issue_id: issueId,
    author: test.author ?? email,
    triage: {
      approved: test.approved,
      ready_for_review: test.readyForReview,
    },
    desired_output: test.desiredOutput,
    desired_output_source: (test.desiredOutputSource ? test.desiredOutputSource : null) as 'human' | 'model' | null,
    messages: test.messages ?? [],
    flags: test.flags,
    prompt: test.prompt,
    sample_output: test.sampleOutput,
    validators: [
      {
        type: 'llmjudge',
        parameters: {
          judge_type: judgeInfo?.judgeType ?? '',
          judge_guidelines: judgeInfo?.judgeGuidelines ?? '',
          judge_template: judgeInfo?.judgeTemplate ?? '',
        },
      },
    ],
    tools: test.prompt
      ? (() => {
          try {
            return parseToolCall(test.prompt);
          } catch (e) {
            console.error(e);
            throw new Error('Prompt includes nvalid JSON');
          }
        })()
      : null,
  };

  return serverSchema;
};

export const createEmptyTest = (email?: string): Test => {
  return {
    author: email ?? '',
    prompt: '',
    messages: undefined,
    sampleOutput: '',
    desiredOutput: '',
    desiredOutputSource: undefined,
    validators: [
      {
        type: 'llmjudge',
        parameters: {
          judgeType: '',
          judgeGuidelines: 'Model output should be well aligned with the ground truth text.',
          judgeTemplate: '',
        },
      },
    ],
    issueId: '',
    flags: [],
    approved: false,
    readyForReview: false,
    active: true,
    comments: [],
  };
};

export const getConnectedTests = async (selectedIssue: Issue) => {
  const tests = [];
  for (const id of selectedIssue.testIds) {
    const d = await getDashboardTest(id);
    tests.push(d);
  }
  return tests;
};

export const getValidatorsFromIssue = (openedTests: Test[]): Validator[] => {
  const tests = openedTests;
  const validators: Validator[] = [];

  for (const test of tests) {
    const testValidator = getJudgeValues(test);
    const exist = validators.find(
      (v) =>
        v.judgeType === (testValidator?.judgeType ?? '') &&
        v.judgeGuidelines === (testValidator?.judgeGuidelines ?? ''),
    );

    if (exist) exist.testIds.push(test.id!);
    else
      validators.push({
        judgeType: testValidator?.judgeType ?? '',
        judgeGuidelines: testValidator?.judgeGuidelines ?? '',
        testIds: [test.id!],
      });
  }
  return validators;
};

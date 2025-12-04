export function getEnumKeyByValue<T extends object>(enumObj: T, value: string): keyof T | undefined {
  return (Object.keys(enumObj) as Array<keyof T>).find((key) => enumObj[key] === value);
}

export enum JudgeTypes {
  'Model response + desired output + prompt text' = 'Prompt template 1: input + output + ground truth + judge guideline',
  'Model response + desired output' = 'Prompt template 2: output + ground truth + judge guideline',
  'Model response' = 'Prompt template 3: output + judge guideline',
}

export const parseJudgeType = (type: JudgeTypes) => {
  if (type === JudgeTypes['Model response + desired output']) return 'Model response + desired output';
  if (type === JudgeTypes['Model response + desired output + prompt text'])
    return 'Model response + desired output + prompt text';
  if (type === JudgeTypes['Model response']) return 'Model response';
  return type;
};

export enum TestStatus {
  draft = 'Draft',
  readyForReview = 'Ready for review',
}

export const isTestStatus = (status: string): status is TestStatus =>
  Object.values(TestStatus).includes(status as TestStatus);

export const isJudgeTypeValid = (judgetype: string): judgetype is JudgeTypes => {
  return Object.values(JudgeTypes).includes(judgetype as JudgeTypes);
};

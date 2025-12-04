import { TestRunResultByIssue } from '@utils/reportProcessors';

export type IssuePassRate = {
  issueId: string;
  testRunResults: TestRunResult[];
};

export type TestRunResult = {
  runId: string;
  modelId: string;
} & Omit<TestRunResultByIssue, 'issueId' | 'issueTitle'>;

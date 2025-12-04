import { Issue } from './getFunctions/getDashboardIssues';
import { Result } from './getFunctions/getDashboardResult';
import { getAvgJudgeScore } from './parseJudgeScore';

export type TestRunResultByIssue = {
  issueId: string;
  issueTitle: string;
  passedTestTotal: number;
  testTotal: number;
  tests: {
    id: string;
    justification: string[];
    score: number[];
    judgeModelId: string[];
  }[];
};
//TODO: handle multiple judges
export function groupTestRunResultByIssues(issues: Issue[], testRuns: Result[]) {
  const data: TestRunResultByIssue[] = [];
  for (const issue of issues) {
    const item: TestRunResultByIssue = {
      issueId: issue.id!,
      issueTitle: issue.title,
      passedTestTotal: 0,
      testTotal: 0,
      tests: [],
    };
    const testResults = testRuns.filter((run) => issue.testIds.includes(run.testId));
    for (const testResult of testResults) {
      const { testId: id, judgeResults } = testResult;

      item.tests.push({
        id,
        justification: judgeResults.map((d) => d.testJustification) || '',
        score: judgeResults.map((d) => Number(d.testScore)),
        judgeModelId: judgeResults.map((d) => d.modelId),
      });
      const avgScore = Number(getAvgJudgeScore(testResult) ?? 0);
      item.testTotal += 1;
      if (avgScore > 0.5) item.passedTestTotal += 1;
    }
    if (item.tests.length) data.push(item);
  }
  return data;
}

import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { type Result } from '@utils/getFunctions/getDashboardResult';
import { parseBinaryJudgeScore } from '@utils/parseJudgeScore';

export type ResultByIssueTag = {
  group: string; //'Passed' | 'Failed' | 'Same' | 'Worse' | 'Better' | 'No overlap' for score
  key: string;
  testIds: string[];
  value: number;
};

export const groupScoreResultByIssueTag = (issues: Issue[], results: Result[]): ResultByIssueTag[] => {
  const data: ResultByIssueTag[] = [];

  const appendData = (group: ResultByIssueTag['group'], key: string, testId?: string) => {
    const target = data.find((d) => d.group === group && key === d.key);
    if (target) {
      target.value += 1;
      target.testIds = [...target.testIds, testId!];
    } else {
      data.push({
        group,
        key,
        testIds: [testId!],
        value: 1,
      });
    }
  };

  for (const result of results) {
    const testId = result.testId;
    const issue = issues.find((d) => d.testIds.includes(testId));
    const group = parseBinaryJudgeScore(result) ? 'Passed' : 'Failed';

    if (!issue || !issue.tags) {
      appendData(group, 'No tag');
    } else {
      for (const tag of issue.tags) {
        appendData(group, tag, testId);
      }
    }
  }

  return data;
};

export const groupPassResultByIssueTag = (issues: Issue[], reports: SelectedReport[]): ResultByIssueTag[] => {
  const data: (ResultByIssueTag & { total: number })[] = [];

  const appendData = (group: ResultByIssueTag['group'], key: string, testId?: string) => {
    const target = data.find((d) => d.group === group && key === d.key);
    if (target) {
      target.value += 1;
      target.testIds = [...target.testIds, testId!];
      target.total += 1;
    } else {
      data.push({
        group,
        key,
        testIds: [testId!],
        value: 1,
        total: 1,
      });
    }
  };

  const appendTotal = (group: ResultByIssueTag['group'], key: string) => {
    const target = data.find((d) => d.group === group && key === d.key);
    if (target) {
      target.total += 1;
    } else {
      data.push({
        group,
        key,
        testIds: [],
        value: 0,
        total: 1,
      });
    }
  };

  for (const report of reports) {
    const group = `${report.report.modelId} (${report.report.runId})`;
    if (!report.results) continue;
    for (const result of report.results) {
      const testId = result.testId;
      const issue = issues.find((d) => d.testIds.includes(testId));
      const fn = !parseBinaryJudgeScore(result) ? appendTotal : appendData;
      if (!issue || !issue.tags) {
        fn(group, 'No tag');
      } else {
        for (const tag of issue.tags) {
          fn(group, tag, issue.id);
        }
      }
    }
  }

  return data.map(({ group, key, testIds, value, total }) => ({ group, key, testIds, value: (value / total) * 100 }));
};

export const compareIssueTagResults = (issues: Issue[], reports: SelectedReport[]): ResultByIssueTag[] => {
  const baseResult = groupScoreResultByIssueTag(issues, reports[1].results || []);
  const targetResult = groupScoreResultByIssueTag(issues, reports[0].results || []);

  const categories = [...baseResult.map((d) => d.key), ...targetResult.map((d) => d.key)].filter(
    (d, i, arr) => arr.indexOf(d) === i,
  );

  return categories
    .map((category) => {
      const base = baseResult.filter((d) => d.key === category);
      const target = targetResult.filter((d) => d.key === category);

      const basePassed = base.find((d) => d.group === 'Passed')?.testIds || [];
      const targetPassed = target.find((d) => d.group === 'Passed')?.testIds || [];

      const baseFailed = base.find((d) => d.group === 'Failed')?.testIds || [];
      const targetFailed = target.find((d) => d.group === 'Failed')?.testIds || [];

      const same = [
        ...basePassed.filter((id) => targetPassed.includes(id)),
        ...baseFailed.filter((id) => targetFailed.includes(id)),
      ];
      const better = basePassed?.filter((id) => targetFailed?.includes(id));
      const worse = baseFailed?.filter((id) => targetPassed?.includes(id));

      const noOverlap = [...base, ...target]
        .map((d) => d.testIds)
        .flat()
        .filter((i) => !(same.includes(i) || worse.includes(i) || better.includes(i)));
      return [
        {
          group: 'Same',
          key: category,
          testIds: same,
          value: same.length,
        },
        {
          group: 'Worse',
          key: category,
          testIds: worse,
          value: worse.length,
        },
        {
          group: 'Better',
          key: category,
          testIds: better,
          value: better.length,
        },
        ...(noOverlap.length
          ? [
              {
                group: 'No overlap' as ResultByIssueTag['group'],
                key: category,
                testIds: noOverlap,
                value: noOverlap.length,
              },
            ]
          : []),
      ];
    })
    .flat() as ResultByIssueTag[];
};

export const comparScores = (reports: SelectedReport[]) => {
  const baseResults = reports[1].results || [];
  const targetResults = reports[0].results || [];

  const basePassed = baseResults.filter((d) => !!parseBinaryJudgeScore(d))?.map((d) => d.testId) || [];
  const targetPassed = targetResults.filter((d) => !!parseBinaryJudgeScore(d))?.map((d) => d.testId) || [];

  const baseFailed = baseResults.filter((d) => !parseBinaryJudgeScore(d))?.map((d) => d.testId) || [];
  const targetFailed = targetResults.filter((d) => !parseBinaryJudgeScore(d))?.map((d) => d.testId) || [];

  const same = [
    ...basePassed.filter((id) => targetPassed.includes(id)),
    ...baseFailed.filter((id) => targetFailed.includes(id)),
  ];
  const better = basePassed?.filter((id) => targetFailed?.includes(id));
  const worse = baseFailed?.filter((id) => targetPassed?.includes(id));

  const noOverlap = [...baseResults, ...targetResults]
    .map((d) => d.testId)
    .flat()
    .filter((i) => !(same.includes(i) || worse.includes(i) || better.includes(i)));

  return [
    {
      group: 'Same',
      testIds: same,
      value: same.length,
    },
    {
      group: 'Worse',
      testIds: worse,
      value: worse.length,
    },
    {
      group: 'Better',
      testIds: better,
      value: better.length,
    },
    ...(noOverlap.length
      ? [
          {
            group: 'No overlap' as ResultByIssueTag['group'],
            testIds: noOverlap,
            value: noOverlap.length,
          },
        ]
      : []),
  ];
};

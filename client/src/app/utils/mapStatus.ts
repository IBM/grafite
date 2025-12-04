import { Issue } from './getFunctions/getDashboardIssues';
import { Test } from './getFunctions/getDashboardTests';

export const mapTestStatus = (test: Test) => {
  if (!test.active) return 'Deprecated';

  if (test.approved) return 'Approved';

  if (test.readyForReview) return 'Ready for review';

  return 'Draft';
};

export const mapIssueStatus = (issue: Issue) => {
  if (!issue.active) return 'Deprecated';

  if (issue.resolved) return 'Resolved';

  if (issue.approved) return 'Approved';

  if (issue.readyForReview) return 'Ready for review';

  return 'Draft';
};

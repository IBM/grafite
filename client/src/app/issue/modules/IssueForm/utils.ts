import { TriageStatus } from '@api/dashboard/issues/utils';
import { Issue as ServerSchema } from '@api/dashboard/issues/utils';
import { TagBaseProps } from '@carbon/react/lib/components/Tag/Tag';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';

export const getIssueStatus = (issue: Issue | undefined | null): TriageStatus => {
  if (issue?.resolved) return TriageStatus.RESOLVED;

  if (issue?.approved) return TriageStatus.APPROVED;

  if (issue?.readyForReview) return TriageStatus.READY_FOR_REVIEW;

  return TriageStatus.DRAFT;
};

export const setIssueStatus = (issue: Issue, status: TriageStatus) => {
  const updatedIssue = { ...issue };

  switch (true) {
    case status === TriageStatus.RESOLVED:
      updatedIssue.readyForReview = true;
      updatedIssue.approved = true;
      updatedIssue.resolved = true;
      return updatedIssue;
    case status === TriageStatus.APPROVED:
      updatedIssue.readyForReview = true;
      updatedIssue.approved = true;
      updatedIssue.resolved = false;
      return updatedIssue;
    case status === TriageStatus.READY_FOR_REVIEW:
      updatedIssue.readyForReview = true;
      updatedIssue.approved = false;
      updatedIssue.resolved = false;
      return updatedIssue;
    case status === TriageStatus.DRAFT:
      updatedIssue.readyForReview = false;
      updatedIssue.approved = false;
      updatedIssue.resolved = false;
      return updatedIssue;
  }

  return updatedIssue;
};

export const tagColorMap: { [key in TriageStatus]: TagBaseProps['type'] } = {
  [TriageStatus.RESOLVED]: 'green',
  [TriageStatus.APPROVED]: 'green',
  [TriageStatus.READY_FOR_REVIEW]: 'cyan',
  [TriageStatus.DRAFT]: 'warm-gray',
};

export const mapClientToServerSchema = (issue: Issue, email?: string): Omit<ServerSchema, '_id'> => {
  return {
    title: issue.title,
    description: issue.description,
    authors: email ? [email] : issue.authors,
    tags: issue.tags,
    feedback_ids: issue.feedbackIds,
    test_ids: issue.testIds,
    triage: {
      ready_for_review: issue.readyForReview,
      approved: issue.approved,
      resolved: issue.resolved,
      resolution: issue.resolution,
      note: issue.note,
    },
    active: issue.active,
    sources: issue.sources,
    comments: issue.comments,
  };
};

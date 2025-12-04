import { type Issue } from '@utils/getFunctions/getDashboardIssues';

export const getEmptyIssue = (): Issue => {
  return {
    title: '',
    description: null,
    authors: [],
    tags: null,
    feedbackIds: [],
    testIds: [],
    readyForReview: false,
    approved: false,
    resolved: false,
    resolution: [],
    note: null,
    active: true,
    sources: [],
    comments: [],
  };
};

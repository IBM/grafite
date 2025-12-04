import { Issue as ServerSchema, Source } from '@api/dashboard/issues/utils';
import { APICallError, UserComment } from '@types';

export type IssueSource = Source;

export type Issue = {
  id?: string;
  title: string;
  description?: string | null;
  authors: string[];
  tags?: string[] | null;
  feedbackIds: string[];
  testIds: string[];
  readyForReview: boolean;
  approved: boolean;
  resolved: boolean;
  resolution: string[];
  note: string | null;
  active: boolean;
  sources?: IssueSource[];
  comments?: UserComment[];
};
export function mapIssueToClientSchema(i: ServerSchema): Issue {
  return {
    id: i._id || '',
    title: i.title,
    description: i.description || '',
    authors: i.authors,
    tags: i.tags || [],
    feedbackIds: i.feedback_ids || [],
    testIds: i.test_ids || [],
    readyForReview: i.triage.ready_for_review,
    approved: i.triage.approved,
    resolved: !!i.triage.resolved,
    resolution: i.triage.resolution || [],
    note: i.triage.note ?? null,
    active: i.active,
    sources: i.sources,
    comments: i.comments,
  };
}

export async function getDashboardIssues(): Promise<Issue[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_DASHBOARD_ISSUE_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'No issues returned'));
        } else {
          reject(new APICallError('Failed to get dashboard issues', res.status, res.body));
        }

        return;
      }

      const issues: Issue[] = data.data?.map((issue: ServerSchema) => mapIssueToClientSchema(issue));

      resolve(issues);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

export async function getDashboardIssue(issueId: string): Promise<Issue> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_ISSUE_ENDPOINT}/${issueId}` || '').replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'No issue returned'));
        } else {
          reject(new APICallError('Failed to get dashboard issue', res.status, res.body));
        }

        return;
      }

      const issue: Issue = mapIssueToClientSchema(data.data);

      resolve(issue);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

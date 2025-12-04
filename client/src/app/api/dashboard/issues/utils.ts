import { UserComment } from '@types';

type Triage = {
  ready_for_review: boolean;
  approved: boolean;
  resolved?: boolean | null;
  resolution: string[];
  note?: string | null;
};

export enum SourceType {
  GITHUB = 'github',
  GENERAL = 'general',
}

export enum TriageStatus {
  DRAFT = 'Draft',
  READY_FOR_REVIEW = 'Ready for review',
  APPROVED = 'Approved',
  RESOLVED = 'Resolved',
}

export type Source = {
  type: 'github' | 'general';
  value: string;
};

export type Issue = {
  _id?: string;
  title: string;
  description?: string | null;
  authors: string[];
  tags?: string[] | null;
  feedback_ids: string[];
  test_ids: string[];
  triage: Triage;
  active: boolean;
  sources?: Source[];
  comments?: UserComment[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateSchema(data: any): data is Issue {
  const keys = Object.keys(data);

  const issueSchemaKeys = [
    'title',
    'description',
    'authors',
    'tags',
    'feedback_ids',
    'test_ids',
    'triage',
    'active',
    'sources',
  ];

  for (const key of keys) {
    if (!issueSchemaKeys.includes(key)) {
      console.warn(key + ' is not part of the schema');
      return false;
    }
  }
  return true;
}

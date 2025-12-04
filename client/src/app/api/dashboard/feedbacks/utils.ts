import { UserComment } from '@types';

type RawFeedback = {
  user_rating?: 'THUMBS_UP' | 'THUMBS_DOWN' | null;
  user_tags?: string | null;
  user_comment?: string | null;
  mode?: string | null;
  model_input?: string | null;
  model_output?: string | null;
  user_contact_consent?: string | null;
  model_parameters?: string | null;
};

export type Comment = {
  author: string;
  comment: string;
};

export type Feedback = {
  _id?: string;
  source: string;
  model_id: string;
  revision?: string | null;
  tags: string[];
  recommended_fix?: string | null;
  raw_feedback: RawFeedback;
  triage: {
    emails?: string[] | null;
    comments?: Comment[] | null;
  };
  comments?: UserComment[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateSchema(data: any): data is Feedback {
  const keys = Object.keys(data);

  const feedbackSchemaKeys = ['source', 'model_id', 'revision', 'tags', 'recommended_fix', 'raw_feedback', 'triage'];

  for (const key of keys) {
    if (!feedbackSchemaKeys.includes(key)) {
      console.warn(key + ' is not part of the schema');
      return false;
    }
  }
  return true;
}

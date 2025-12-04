import { APICallError, UserComment } from '@types';
import { type Feedback as ServerSchema, type Comment } from '@api/dashboard/feedbacks/utils';

export type Feedback = {
  id: string;
  source: string;
  modelId: string;
  revision?: string | null;
  tags: string[];
  recommendedFix?: string | null;
  userRating?: 'THUMBS_UP' | 'THUMBS_DOWN' | null;
  userTags?: string | null;
  userComment?: string | null;
  mode?: string | null;
  modelInput?: string | null;
  modelOutput?: string | null;
  modelParameters?: string | null;
  triage: {
    emails?: string[] | null;
    comments?: Comment[] | null;
  };
  comments?: UserComment[];
};

export function mapFeedbackToClientSchema(f: ServerSchema): Feedback {
  return {
    id: f._id || '',
    source: f.source,
    modelId: f.model_id,
    revision: f.revision,
    tags: f.tags,
    recommendedFix: f.recommended_fix,
    userRating: f.raw_feedback.user_rating,
    userTags: f.raw_feedback.user_tags || '',
    userComment: f.raw_feedback.user_comment || '',
    mode: f.raw_feedback.mode || '',
    modelInput: f.raw_feedback.model_input || '',
    modelOutput: f.raw_feedback.model_output || '',
    modelParameters: f.raw_feedback.model_parameters || '',
    triage: {
      emails: f.triage?.emails ?? null,
      comments: f.triage?.comments ?? null,
    },
    comments: f.comments,
  };
}

export async function getDashboardFeedbacks(): Promise<Feedback[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_DASHBOARD_FEEDBACK_ENDPOINT || '').replace(/(?<!:)\/\//g, '/'), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          reject(new APICallError(data.error, res.status, 'No feedbacks returned'));
        } else {
          reject(new APICallError('Failed to get dashboard feedbacks', res.status, res.body));
        }

        return;
      }

      const feedbacks: Feedback[] = data.data?.map((feedback: ServerSchema) => mapFeedbackToClientSchema(feedback));

      resolve(feedbacks);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

export async function getDashboardFeedback(feedbackId: string): Promise<Feedback> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        (`${process.env.NEXT_PUBLIC_DASHBOARD_FEEDBACK_ENDPOINT}/${feedbackId}` || '').replace(/(?<!:)\/\//g, '/'),
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
          reject(new APICallError(data.error, res.status, 'No feedback returned'));
        } else {
          reject(new APICallError('Failed to get dashboard feedback', res.status, res.body));
        }

        return;
      }

      const feedback: Feedback = mapFeedbackToClientSchema(data.data);

      resolve(feedback);
    } catch (error) {
      reject(new APICallError('Something went wrong', 422, error));
    }
  });
}

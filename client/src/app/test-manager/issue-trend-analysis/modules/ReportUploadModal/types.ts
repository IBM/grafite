import type { JudgeResult } from '@api/dashboard/results/utils';

export type { JudgeResult };

export type ParsedResult = {
  test_id: string;
  judge_prompt: string;
  judge_guidelines: string;
  prompt_text: string | null;
  messages?: { role: string; content: string }[];
  ground_truth: string;
  model_response: string;
  judge_results?: JudgeResult[];
};

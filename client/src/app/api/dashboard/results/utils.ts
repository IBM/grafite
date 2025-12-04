export type Result = {
  test_id: string;
  task_name: string;
  is_seed: boolean;
  test_description: string;
  prompt_text: string;
  messages?: { role: string; content: string }[];
  judge_prompt: string;
  judge_guidelines: string;
  ground_truth: string;
  model_response: string;
  judge_results: JudgeResult[];
};

export type JudgeResult = {
  test_score: number;
  test_justification: string;
  model_id: string;
  type?: 'human';
};

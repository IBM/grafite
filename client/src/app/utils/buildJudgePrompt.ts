export default function buildJudgePrompt(
  judge_prompt: string,
  prompt_text: string,
  model_response: string,
  ground_truth: string,
  judge_guidelines: string,
) {
  return judge_prompt
    .replace('{{prompt_text}}', prompt_text)
    .replace('{{model_response}}', model_response)
    .replace('{{ground_truth}}', ground_truth)
    .replace('{{judge_guidelines}}', judge_guidelines);
}

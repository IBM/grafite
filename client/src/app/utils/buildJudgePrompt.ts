import { Message } from '@types';

import { mapMessagesToStr } from './mapMessagesToStr';

export default function buildJudgePrompt(
  judgePrompt: string,
  promptText: string,
  modelResponse: string,
  groundTruth: string,
  judgeGuidelines: string,
  messages?: Message[],
) {
  if (!judgePrompt) return '';
  const input = !!messages?.length ? mapMessagesToStr(messages) : promptText;
  return judgePrompt
    .replace('{{prompt_text}}', input)
    .replace('{{model_response}}', modelResponse)
    .replace('{{ground_truth}}', groundTruth)
    .replace('{{judge_guidelines}}', judgeGuidelines);
}

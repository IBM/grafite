import formatModelId from '@utils/formatModelId';
import { Result } from '@utils/getFunctions/getDashboardResult';

import { ParsedResult } from '../types';

// Map an uploaded file's snake_case rows to the canonical camelCase Result shape
// so uploaded reports flow through the same pipeline as fetched ones. Fields not
// present in a report file (taskName/isSeed/testDescription) default to empty —
// the trend charts derive issue metadata from testId + context, not from these.
export function parsedToResults(parsed: ParsedResult[]): Result[] {
  return parsed.map((r) => ({
    testId: r.test_id.trim(),
    taskName: '',
    isSeed: false,
    testDescription: '',
    promptText: r.prompt_text ?? '',
    messages: r.messages,
    judgePrompt: r.judge_prompt,
    judgeGuidelines: r.judge_guidelines,
    groundTruth: r.ground_truth,
    modelResponse: r.model_response,
    judgeResults: (r.judge_results ?? []).map((j) => ({
      testScore: j.test_score,
      testJustification: j.test_justification,
      modelId: formatModelId(j.model_id),
      ...(j.type && { type: j.type }),
    })),
  }));
}

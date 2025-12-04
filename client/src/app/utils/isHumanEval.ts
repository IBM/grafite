import { JudgeResult } from './getFunctions/getDashboardResult';

export function isHumanEval(result: JudgeResult) {
  return result.type === 'human';
}

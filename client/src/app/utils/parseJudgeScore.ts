import { JudgeResult, Result } from './getFunctions/getDashboardResult';
import { isHumanEval } from './isHumanEval';

export const parseScores = (result: string) => {
  try {
    const trimmed = result.trim();

    //remove unremoved token in the end of the result for some models in WX
    if (trimmed[trimmed.length - 1] !== '}') {
      return JSON.parse(trimmed.split('}').slice(0, -1).join('}') + '}');
    }

    return JSON.parse(trimmed);
  } catch (err) {
    console.error(err);
    return `Output cannot be parsed:\n${result}`;
  }
};

export const parseBinaryJudgeScore = (result: Result) => {
  if (result.judgeResults) {
    const avgScore = getAvgJudgeScore(result);
    const score = avgScore === undefined ? 0 : Number(avgScore);

    return score > 0.5 ? 1 : 0;
  }
  return null;
};

export const getAvgJudgeScore = (result: Result) => {
  if (result.judgeResults) {
    return getAvgJudgeScoreFromResults(result.judgeResults);
  }
  return null;
};

export const getAvgJudgeScoreFromResults = (results: JudgeResult[]) => {
  //find where the model name is email
  const annotation = results.find((result) => isHumanEval(result));

  if (annotation) return annotation.testScore;

  return results.reduce((acc, c) => acc + c.testScore, 0) / results.length;
};

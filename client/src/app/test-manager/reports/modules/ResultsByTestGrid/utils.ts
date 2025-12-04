import { Result } from '@utils/getFunctions/getDashboardResult';

export function sanityCheck(justification: string) {
  const PARSING_ERROR_STRING = 'Parsing error in the judge response string';
  return justification.startsWith(PARSING_ERROR_STRING) || !justification;
}

export type GridRow = Result & { issueId: string; issueTitle: string };

export function sortSanityCheck(a: GridRow, b: GridRow) {
  const firstElementHasSanityIssue = (() => {
    if (a.judgeResults)
      return !!a.judgeResults.map((r) => sanityCheck(r.testJustification)).filter((s) => s === true).length;
    return false;
  })();
  const secondElementHasSanityIssue = (() => {
    if (b.judgeResults)
      return !!b.judgeResults.map((r) => sanityCheck(r.testJustification)).filter((s) => s === true).length;
    return false;
  })();

  const bothHaveParsingError = firstElementHasSanityIssue && secondElementHasSanityIssue;
  const neitherHasSanityIssue = !firstElementHasSanityIssue && !secondElementHasSanityIssue;

  if (bothHaveParsingError || neitherHasSanityIssue) return 0;
  if (firstElementHasSanityIssue) return -1;
  return 1;
}

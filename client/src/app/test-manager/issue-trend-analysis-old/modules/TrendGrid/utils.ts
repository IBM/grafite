import { Test } from '@utils/getFunctions/getDashboardTests';

export type TrendGridData = {
  id: string;
  prompt: string;
  messages: string;
  [key: string]: number | string;
};

export const objArrToString = (data: string | undefined) => {
  if (!data) return '';
  return JSON.stringify(data);
};

export type GridRow = Test & {
  [key: string]: { score: number | string; hasHumanEval: boolean };
};

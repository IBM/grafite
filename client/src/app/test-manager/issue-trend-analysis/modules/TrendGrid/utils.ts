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

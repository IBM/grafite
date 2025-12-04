import { type Test } from '@utils/getFunctions/getDashboardTests';

export const objArrToString = (data: string | undefined) => {
  if (!data) return '';
  return JSON.stringify(data);
  // const addComma = (i: number, arr: any[])=> (arr.length - 1 !== i ? "," : "")
  // const dataFormatted = data.value.map((value: {[key: string]: string}, i: number, arr: {[key: string]: string}[]) => `{\n${Object.entries(value).map(([key, val], i, arr) => `${key}: ${val}${addComma(i, arr)}\n`).join("")}\n}` + addComma(i, arr))
  // return `[\n${dataFormatted}\n]`
};

export const isTestAvailable = (rowData: Test | undefined) => {
  if (!rowData) return false;
  return rowData.approved && rowData.active;
};

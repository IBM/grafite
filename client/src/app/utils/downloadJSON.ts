import { formatDataKeysToSnakeCase } from './convertCameltoSnake';

export const downloadJSON = (data: unknown, exportedFileName: string) => {
  const json = JSON.stringify(formatDataKeysToSnakeCase(data));
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = exportedFileName;
  a.click();
};

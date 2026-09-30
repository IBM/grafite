import { ParsedResult } from '../types';

export async function parseReportFile(file: File): Promise<ParsedResult[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('JSON file must be an array');
  return parsed as ParsedResult[];
}

export function stringifyJudgeModelId(ids: string | string[]) {
  if (Array.isArray(ids)) return ids.join(', ');
  return ids;
}

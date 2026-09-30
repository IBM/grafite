export default function formatModelId(value: string | undefined) {
  if (value === undefined) return '';
  const modelName = value.split('/').slice(1).join('/');
  return !modelName ? value : modelName;
}

export function parseToolCall(prompt: string) {
  const toolsMatch = prompt.match(/<\|start_of_role\|>tools<\|end_of_role\|>([\s\S]*?)(?=<\|end_of_text\|>|$)/);

  if (!toolsMatch) return null;

  return toolsMatch[1]
    .trim()
    .split('\n\n')
    .map((v) => {
      const removeFirst = v.startsWith('[');
      const removeLast = v.endsWith(']');

      return v.substring(removeFirst ? 1 : 0, removeLast ? v.length - 1 : v.length);
    })
    .map((v) => JSON.parse(v.replaceAll("'", '"')));
}

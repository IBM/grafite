import { Message } from '@types';

export function mapMessagesToStr(messages: Message[]) {
  if (!messages || !Array.isArray(messages)) return '';
  return messages.map((message) => `${message.role}: ${message.content}`).join('\n');
}

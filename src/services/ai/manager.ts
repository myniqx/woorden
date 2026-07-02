import { completeJson } from '../../utils/completeJson';
import type { AIAdapter, AIChatMessage, AIStreamOptions } from './types';

function extractJson(raw: string): string {
  const start = raw.indexOf('{');
  if (start === -1) return raw;
  const end = raw.lastIndexOf('}');
  if (end === -1) return raw.slice(start);
  return raw.slice(start, end + 1);
}

export async function streamObject<T>(
  adapter: AIAdapter,
  prompt: string,
  onPartial: (partial: Partial<T>) => void,
  options?: AIStreamOptions,
): Promise<T> {
  let accumulated = '';

  for await (const chunk of adapter.stream(prompt, options)) {
    accumulated += chunk;
    const completed = completeJson(extractJson(accumulated));
    if (completed) {
      try {
        onPartial(JSON.parse(completed) as Partial<T>);
      } catch {
        // not yet parseable — wait for more chunks
      }
    }
  }

  const finalJson = completeJson(extractJson(accumulated));
  if (!finalJson) throw new Error('No valid JSON in AI response');
  return JSON.parse(finalJson) as T;
}

export interface ChatStreamResult {
  text: string;
  /** true when the model hit its output token limit and the reply is cut off */
  truncated: boolean;
}

export async function streamChat(
  adapter: AIAdapter,
  system: string,
  messages: AIChatMessage[],
  onChunk: (accumulated: string) => void,
  options?: AIStreamOptions,
): Promise<ChatStreamResult> {
  let accumulated = '';
  let truncated = false;

  const streamOptions: AIStreamOptions = {
    ...options,
    onFinish: reason => {
      if (reason === 'length') truncated = true;
      options?.onFinish?.(reason);
    },
  };

  for await (const chunk of adapter.chat(system, messages, streamOptions)) {
    accumulated += chunk;
    onChunk(accumulated);
  }

  return { text: accumulated, truncated };
}

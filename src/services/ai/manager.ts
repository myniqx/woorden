import { completeJson } from '../../utils/completeJson';
import type { AIAdapter, AIChatMessage, AIStreamOptions } from './types';

function extractJson(raw: string): string {
  const start = raw.indexOf('{');
  if (start === -1) return raw;
  const end = raw.lastIndexOf('}');
  if (end === -1) return raw.slice(start);
  return raw.slice(start, end + 1);
}

function emitPartial<T>(accumulated: string, onPartial: (partial: Partial<T>) => void): void {
  const completed = completeJson(extractJson(accumulated));
  if (!completed) return;
  try {
    onPartial(JSON.parse(completed) as Partial<T>);
  } catch {
    // not yet parseable — wait for more chunks
  }
}

function parseFinal<T>(accumulated: string): T | null {
  const finalJson = completeJson(extractJson(accumulated));
  if (!finalJson) return null;
  try {
    return JSON.parse(finalJson) as T;
  } catch {
    return null;
  }
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
    emitPartial(accumulated, onPartial);
  }

  const result = parseFinal<T>(accumulated);
  if (result === null) throw new Error('No valid JSON in AI response');
  return result;
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

export interface ChatObjectStreamResult<T> {
  /** Parsed object, or null when the response contained no valid JSON (fall back to text). */
  object: T | null;
  /** Raw accumulated response text. */
  text: string;
  /** true when the model hit its output token limit and the reply is cut off */
  truncated: boolean;
}

export async function streamChatObject<T>(
  adapter: AIAdapter,
  system: string,
  messages: AIChatMessage[],
  onPartial: (partial: Partial<T>) => void,
  options?: AIStreamOptions,
): Promise<ChatObjectStreamResult<T>> {
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
    emitPartial(accumulated, onPartial);
  }

  return { object: parseFinal<T>(accumulated), text: accumulated, truncated };
}

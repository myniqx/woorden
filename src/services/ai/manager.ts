import { completeJson } from '../../utils/completeJson';
import type { AIAdapter } from './types';

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
): Promise<T> {
  let accumulated = '';

  for await (const chunk of adapter.stream(prompt)) {
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

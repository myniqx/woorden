import { completeJson } from '../../utils/completeJson';
import type { AIAdapter } from './types';

export async function streamObject<T>(
  adapter: AIAdapter,
  prompt: string,
  onPartial: (partial: Partial<T>) => void,
): Promise<T> {
  let accumulated = '';

  for await (const chunk of adapter.stream(prompt)) {
    accumulated += chunk;
    const completed = completeJson(accumulated);
    if (completed) {
      try {
        onPartial(JSON.parse(completed) as Partial<T>);
      } catch {
        // not yet parseable — wait for more chunks
      }
    }
  }

  return JSON.parse(completeJson(accumulated)) as T;
}

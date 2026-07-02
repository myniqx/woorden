import { useCallback, useRef, useState } from 'preact/hooks';
import { streamChat, toAIError, AIError } from '../services/ai';
import type { AIAdapter, AIChatMessage, AIStreamOptions } from '../services/ai';

export interface AIChatSendResult {
  text: string;
  truncated: boolean;
  error: AIError | null;
}

export interface UseAIChatOptions {
  /** Only the last N messages are sent to the AI; the UI can keep the full history. */
  historyLimit?: number;
}

export interface UseAIChatResult {
  /**
   * Streams one assistant reply. onChunk receives the accumulated text on every chunk.
   * Resolves with the final text (or the error — never rejects). Returns null when
   * another send is already in flight.
   */
  send: (
    adapter: AIAdapter,
    system: string,
    messages: AIChatMessage[],
    onChunk: (accumulated: string) => void,
    options?: Omit<AIStreamOptions, 'signal'>,
  ) => Promise<AIChatSendResult | null>;
  abort: () => void;
  isStreaming: boolean;
  error: AIError | null;
}

export function useAIChat({ historyLimit }: UseAIChatOptions = {}): UseAIChatResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(async (
    adapter: AIAdapter,
    system: string,
    messages: AIChatMessage[],
    onChunk: (accumulated: string) => void,
    options?: Omit<AIStreamOptions, 'signal'>,
  ): Promise<AIChatSendResult | null> => {
    if (abortRef.current) return null;

    const controller = new AbortController();
    abortRef.current = controller;
    const windowed = historyLimit ? messages.slice(-historyLimit) : messages;

    setError(null);
    setIsStreaming(true);
    try {
      const result = await streamChat(adapter, system, windowed, onChunk, {
        ...options,
        signal: controller.signal,
      });
      return { ...result, error: null };
    } catch (e) {
      const err = toAIError(e, 'AI');
      if (err.kind !== 'aborted') setError(err);
      return { text: '', truncated: false, error: err };
    } finally {
      setIsStreaming(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [historyLimit]);

  return { send, abort, isStreaming, error };
}

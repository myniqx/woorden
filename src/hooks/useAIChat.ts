import { useCallback, useRef, useState } from 'preact/hooks';
import { streamChat, streamChatObject, toAIError, AIError } from '../services/ai';
import type { AIAdapter, AIChatMessage, AIStreamOptions } from '../services/ai';

export interface AIChatSendResult {
  text: string;
  truncated: boolean;
  error: AIError | null;
}

export interface AIChatSendObjectResult<T> {
  /** Parsed object, or null when the response contained no valid JSON (fall back to text). */
  object: T | null;
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
  /**
   * Streams one assistant reply expected to be JSON. onPartial receives the parsed
   * partial object on every chunk (via completeJson repair). Resolves with the final
   * parsed object — or object: null with the raw text when the response wasn't valid
   * JSON. Never rejects. Returns null when another send is already in flight.
   */
  sendObject: <T>(
    adapter: AIAdapter,
    system: string,
    messages: AIChatMessage[],
    onPartial: (partial: Partial<T>) => void,
    options?: Omit<AIStreamOptions, 'signal'>,
  ) => Promise<AIChatSendObjectResult<T> | null>;
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

  /** Shared single-flight guard + abort/error/streaming state around one stream call. */
  const runStream = useCallback(async <R>(
    messages: AIChatMessage[],
    fn: (windowed: AIChatMessage[], signal: AbortSignal) => Promise<R>,
    onError: (err: AIError) => R,
  ): Promise<R | null> => {
    if (abortRef.current) return null;

    const controller = new AbortController();
    abortRef.current = controller;
    const windowed = historyLimit ? messages.slice(-historyLimit) : messages;

    setError(null);
    setIsStreaming(true);
    try {
      return await fn(windowed, controller.signal);
    } catch (e) {
      const err = toAIError(e, 'AI');
      if (err.kind !== 'aborted') setError(err);
      return onError(err);
    } finally {
      setIsStreaming(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [historyLimit]);

  const send = useCallback((
    adapter: AIAdapter,
    system: string,
    messages: AIChatMessage[],
    onChunk: (accumulated: string) => void,
    options?: Omit<AIStreamOptions, 'signal'>,
  ): Promise<AIChatSendResult | null> => {
    return runStream(
      messages,
      async (windowed, signal): Promise<AIChatSendResult> => {
        const result = await streamChat(adapter, system, windowed, onChunk, { ...options, signal });
        return { ...result, error: null };
      },
      err => ({ text: '', truncated: false, error: err }),
    );
  }, [runStream]);

  const sendObject = useCallback(<T,>(
    adapter: AIAdapter,
    system: string,
    messages: AIChatMessage[],
    onPartial: (partial: Partial<T>) => void,
    options?: Omit<AIStreamOptions, 'signal'>,
  ): Promise<AIChatSendObjectResult<T> | null> => {
    return runStream(
      messages,
      async (windowed, signal): Promise<AIChatSendObjectResult<T>> => {
        const result = await streamChatObject<T>(adapter, system, windowed, onPartial, { ...options, signal });
        return { ...result, error: null };
      },
      err => ({ object: null, text: '', truncated: false, error: err }),
    );
  }, [runStream]);

  return { send, sendObject, abort, isStreaming, error };
}

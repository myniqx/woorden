import type { AIFinishReason, AIStreamOptions } from './types';
import { httpToAIError, toAIError } from './errors';

export interface SSEChunk {
  text?: string;
  finish?: AIFinishReason;
}

interface SSERequest {
  headers?: Record<string, string>;
  body: object;
}

/**
 * Shared SSE streaming for all adapters: fetch + line buffering + `data:` parsing.
 * `extract` maps one parsed SSE payload to text/finish-reason.
 * Errors are always thrown as AIError; onFinish fires once on normal completion.
 */
export async function* streamSSE(
  provider: string,
  url: string,
  request: SSERequest,
  extract: (parsed: unknown) => SSEChunk,
  options?: AIStreamOptions,
): AsyncIterable<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...request.headers },
      body: JSON.stringify(request.body),
      signal: options?.signal,
    });
  } catch (e) {
    throw toAIError(e, provider);
  }

  if (!response.ok) {
    const err = await response.text();
    throw httpToAIError(provider, response.status, err);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finish: AIFinishReason = 'unknown';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          options?.onFinish?.(finish);
          return;
        }

        try {
          const chunk = extract(JSON.parse(data));
          if (chunk.finish) finish = chunk.finish;
          if (chunk.text) yield chunk.text;
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  } catch (e) {
    throw toAIError(e, provider);
  }

  options?.onFinish?.(finish);
}

/** finish_reason mapping for OpenAI-compatible APIs (Groq, Ollama, LM Studio). */
function mapOpenAIFinish(reason: unknown): AIFinishReason | undefined {
  if (reason === 'stop') return 'stop';
  if (reason === 'length') return 'length';
  if (typeof reason === 'string') return 'unknown';
  return undefined;
}

/** Delta extractor for OpenAI-compatible chat completion streams. */
export function extractOpenAI(parsed: unknown): SSEChunk {
  const choice = (parsed as { choices?: { delta?: { content?: string }; finish_reason?: unknown }[] })
    ?.choices?.[0];
  return {
    text: choice?.delta?.content,
    finish: mapOpenAIFinish(choice?.finish_reason),
  };
}

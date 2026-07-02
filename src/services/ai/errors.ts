export type AIErrorKind =
  | 'rate_limit'
  | 'auth'
  | 'context_length'
  | 'network'
  | 'aborted'
  | 'unknown';

export class AIError extends Error {
  readonly kind: AIErrorKind;
  readonly status?: number;

  constructor(kind: AIErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'AIError';
    this.kind = kind;
    this.status = status;
  }
}

export function httpToAIError(provider: string, status: number, body: string): AIError {
  const message = `${provider} error ${status}: ${body}`;
  if (status === 429) return new AIError('rate_limit', message, status);
  if (status === 401 || status === 403) return new AIError('auth', message, status);
  if (status === 400 && /context|token|length|too long/i.test(body)) {
    return new AIError('context_length', message, status);
  }
  return new AIError('unknown', message, status);
}

export function toAIError(e: unknown, provider: string): AIError {
  if (e instanceof AIError) return e;
  if (e instanceof DOMException && e.name === 'AbortError') {
    return new AIError('aborted', `${provider} request aborted`);
  }
  // fetch rejects with TypeError on network failure
  if (e instanceof TypeError) {
    return new AIError('network', `${provider} network error: ${e.message}`);
  }
  return new AIError('unknown', e instanceof Error ? e.message : String(e));
}

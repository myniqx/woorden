import type { AIAdapter, AIChatMessage, AIStreamOptions } from '../types';
import { streamSSE, type SSEChunk } from '../sse';

function extractServer(parsed: unknown): SSEChunk {
  const text = (parsed as { text?: unknown })?.text;
  return { text: typeof text === 'string' ? text : undefined };
}

export class ServerAdapter implements AIAdapter {
  private endpoint: string;

  preferredModel = 'server';

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getModels(): Promise<string[]> {
    return ['server'];
  }

  stream(prompt: string, options?: AIStreamOptions): AsyncIterable<string> {
    return streamSSE('Server', this.endpoint, { body: { prompt } }, extractServer, options);
  }

  chat(system: string, messages: AIChatMessage[], options?: AIStreamOptions): AsyncIterable<string> {
    return streamSSE('Server', this.endpoint, { body: { system, messages } }, extractServer, options);
  }
}

import type { AIAdapter, AIChatMessage } from '../types';

class LocalAdapter implements AIAdapter {
  protected baseUrl: string;
  protected model: string;
  preferredModel: string;

  constructor(baseUrl: string, defaultModel: string, model?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.preferredModel = defaultModel;
    this.model = model ?? defaultModel;
  }

  getModels(): Promise<string[]> {
    throw new Error('getModels must be implemented by subclass');
  }

  private async *streamRaw(messages: object[]): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages, stream: true }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Local AI error ${response.status}: ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const text: string | undefined = parsed?.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  }

  async *stream(prompt: string): AsyncIterable<string> {
    yield* this.streamRaw([{ role: 'user', content: `Reply with a json object. ${prompt}` }]);
  }

  async *chat(system: string, messages: AIChatMessage[]): AsyncIterable<string> {
    yield* this.streamRaw([
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ]);
  }
}

export const OLLAMA_DEFAULT_URL = 'http://localhost:11434';
export const LMSTUDIO_DEFAULT_URL = 'http://localhost:1234';

export class OllamaAdapter extends LocalAdapter {
  constructor(baseUrl: string, model?: string) {
    super(baseUrl || OLLAMA_DEFAULT_URL, 'llama3.2', model);
  }

  async getModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`);
    if (!res.ok) throw new Error(`Ollama models error ${res.status}`);
    const data = await res.json();
    return (data.models as { name: string }[]).map(m => m.name).sort();
  }
}

export class LMStudioAdapter extends LocalAdapter {
  constructor(baseUrl: string, model?: string) {
    super(baseUrl || LMSTUDIO_DEFAULT_URL, '', model);
  }

  async getModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/v1/models`);
    if (!res.ok) throw new Error(`LM Studio models error ${res.status}`);
    const data = await res.json();
    return (data.data as { id: string }[]).map(m => m.id).sort();
  }
}

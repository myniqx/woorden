import type { AIAdapter, AIChatMessage } from '../types';

export class GroqAdapter implements AIAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async *streamRaw(messages: object[], jsonMode = false): AsyncIterable<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        stream: true,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq error ${response.status}: ${err}`);
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
    yield* this.streamRaw([{ role: 'user', content: `Reply with a json object. ${prompt}` }], true);
  }

  async *chat(system: string, messages: AIChatMessage[]): AsyncIterable<string> {
    yield* this.streamRaw([
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ]);
  }
}

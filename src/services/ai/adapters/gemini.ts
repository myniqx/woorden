import type { AIAdapter, AIChatMessage } from '../types';

const GEMINI_PREFERRED = 'gemini-2.5-flash-lite';

export class GeminiAdapter implements AIAdapter {
  private apiKey: string;
  private model: string;

  preferredModel = GEMINI_PREFERRED;

  getKeyGuide(language: string): string {
    const guides: Record<string, string> = {
      en: `## Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Select an existing Google Cloud project or create a new one
5. Copy the generated API key and paste it above

> **Note:** Gemini offers a free tier with generous limits — no billing required to get started.`,

      tr: `## Google Gemini API Anahtarı

1. [Google AI Studio](https://aistudio.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. **Create API key** butonuna tıklayın
4. Mevcut bir Google Cloud projesi seçin veya yeni bir tane oluşturun
5. Oluşturulan API anahtarını kopyalayıp yukarıya yapıştırın

> **Not:** Gemini ücretsiz bir katman sunar ve başlamak için fatura bilgisi gerekmez.`,

      ar: `## مفتاح API لـ Google Gemini

1. اذهب إلى [Google AI Studio](https://aistudio.google.com/app/apikey)
2. سجّل الدخول بحساب Google الخاص بك
3. انقر على **Create API key**
4. اختر مشروع Google Cloud موجوداً أو أنشئ مشروعاً جديداً
5. انسخ مفتاح API الناتج والصقه أعلاه

> **ملاحظة:** يوفر Gemini طبقة مجانية بحدود سخية — لا يلزم إدخال بيانات الفوترة للبدء.`,

      fr: `## Clé API Google Gemini

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **Create API key**
4. Sélectionnez un projet Google Cloud existant ou créez-en un nouveau
5. Copiez la clé API générée et collez-la ci-dessus

> **Remarque :** Gemini propose un niveau gratuit avec des limites généreuses — aucune facturation requise pour commencer.`,
    };
    return guides[language] ?? guides.en;
  }

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? GEMINI_PREFERRED;
  }

  async getModels(): Promise<string[]> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
    );
    if (!res.ok) throw new Error(`Gemini models error ${res.status}`);
    const data = await res.json();
    return (data.models as { name: string; supportedGenerationMethods?: string[] }[])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
  }

  private async *streamRaw(body: object): AsyncIterable<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini error ${response.status}: ${err}`);
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
          const text: string | undefined =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  }

  async *stream(prompt: string): AsyncIterable<string> {
    yield* this.streamRaw({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  async *chat(system: string, messages: AIChatMessage[]): AsyncIterable<string> {
    yield* this.streamRaw({
      system_instruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });
  }
}

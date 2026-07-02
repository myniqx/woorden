import type { AIAdapter, AIChatMessage, AIFinishReason, AIStreamOptions } from '../types';
import { streamSSE, type SSEChunk } from '../sse';

function mapGeminiFinish(reason: unknown): AIFinishReason | undefined {
  if (reason === 'STOP') return 'stop';
  if (reason === 'MAX_TOKENS') return 'length';
  if (typeof reason === 'string') return 'unknown';
  return undefined;
}

function extractGemini(parsed: unknown): SSEChunk {
  const candidate = (parsed as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: unknown }[];
  })?.candidates?.[0];
  return {
    text: candidate?.content?.parts?.[0]?.text,
    finish: mapGeminiFinish(candidate?.finishReason),
  };
}

const GEMINI_PREFERRED = 'gemini-3.1-flash-lite';
const modelCache = new Map<string, string[]>();

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
    const cached = modelCache.get(this.apiKey);
    if (cached) return cached;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
    );
    if (!res.ok) throw new Error(`Gemini models error ${res.status}`);
    const data = await res.json();
    const models = (data.models as { name: string; supportedGenerationMethods?: string[] }[])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
    modelCache.set(this.apiKey, models);
    return models;
  }

  private streamRaw(body: object, options?: AIStreamOptions): AsyncIterable<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    return streamSSE('Gemini', url, { body }, extractGemini, options);
  }

  private generationConfig(options?: AIStreamOptions, extra: Record<string, unknown> = {}): Record<string, unknown> {
    const config = { ...extra };
    if (options?.temperature !== undefined) config.temperature = options.temperature;
    if (options?.maxTokens !== undefined) config.maxOutputTokens = options.maxTokens;
    return config;
  }

  stream(prompt: string, options?: AIStreamOptions): AsyncIterable<string> {
    return this.streamRaw({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: this.generationConfig(options, { responseMimeType: 'application/json' }),
    }, options);
  }

  chat(system: string, messages: AIChatMessage[], options?: AIStreamOptions): AsyncIterable<string> {
    return this.streamRaw({
      system_instruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: this.generationConfig(options),
    }, options);
  }
}

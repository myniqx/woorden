import type { AIAdapter, AIChatMessage, AIStreamOptions } from '../types';
import { streamSSE, extractOpenAI } from '../sse';

const GROQ_PREFERRED = 'llama-3.3-70b-versatile';
const modelCache = new Map<string, string[]>();

export class GroqAdapter implements AIAdapter {
  private apiKey: string;
  private model: string;

  preferredModel = GROQ_PREFERRED;

  getKeyGuide(language: string): string {
    const guides: Record<string, string> = {
      en: `## Groq API Key

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up or sign in
3. Click **Create API Key**
4. Give it a name and click **Submit**
5. Copy the key — it's only shown once

> **Note:** Groq is free to use with rate limits. No credit card required.`,

      tr: `## Groq API Anahtarı

1. [Groq Console](https://console.groq.com/keys) adresine gidin
2. Kayıt olun veya giriş yapın
3. **Create API Key** butonuna tıklayın
4. Bir isim verin ve **Submit** butonuna tıklayın
5. Anahtarı kopyalayın — yalnızca bir kez gösterilir

> **Not:** Groq, hız sınırları olan ücretsiz bir plan sunar. Kredi kartı gerekmez.`,

      ar: `## مفتاح API لـ Groq

1. اذهب إلى [Groq Console](https://console.groq.com/keys)
2. سجّل حساباً جديداً أو سجّل الدخول
3. انقر على **Create API Key**
4. أعطه اسماً وانقر على **Submit**
5. انسخ المفتاح — يُعرض مرة واحدة فقط

> **ملاحظة:** Groq مجاني مع حدود للاستخدام. لا يلزم بطاقة ائتمان.`,

      fr: `## Clé API Groq

1. Rendez-vous sur [Groq Console](https://console.groq.com/keys)
2. Inscrivez-vous ou connectez-vous
3. Cliquez sur **Create API Key**
4. Donnez-lui un nom et cliquez sur **Submit**
5. Copiez la clé — elle n'est affichée qu'une seule fois

> **Remarque :** Groq est gratuit avec des limites de débit. Aucune carte bancaire requise.`,
    };
    return guides[language] ?? guides.en;
  }

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? GROQ_PREFERRED;
  }

  async getModels(): Promise<string[]> {
    const cached = modelCache.get(this.apiKey);
    if (cached) return cached;
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`Groq models error ${res.status}`);
    const data = await res.json();
    const models = (data.data as { id: string }[]).map(m => m.id).sort();
    modelCache.set(this.apiKey, models);
    return models;
  }

  private streamRaw(messages: object[], jsonMode: boolean, options?: AIStreamOptions): AsyncIterable<string> {
    const body = {
      model: this.model,
      messages,
      stream: true,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options?.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
    };
    return streamSSE(
      'Groq',
      'https://api.groq.com/openai/v1/chat/completions',
      { headers: { Authorization: `Bearer ${this.apiKey}` }, body },
      extractOpenAI,
      options,
    );
  }

  stream(prompt: string, options?: AIStreamOptions): AsyncIterable<string> {
    return this.streamRaw([{ role: 'user', content: `Reply with a json object. ${prompt}` }], true, options);
  }

  chat(system: string, messages: AIChatMessage[], options?: AIStreamOptions): AsyncIterable<string> {
    return this.streamRaw([
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ], false, options);
  }
}

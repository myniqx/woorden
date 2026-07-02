import type { AIAdapter, AIChatMessage, AIStreamOptions } from '../types';
import { streamSSE, extractOpenAI } from '../sse';

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

  private streamRaw(messages: object[], options?: AIStreamOptions): AsyncIterable<string> {
    const body = {
      model: this.model,
      messages,
      stream: true,
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options?.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
    };
    return streamSSE('Local AI', `${this.baseUrl}/v1/chat/completions`, { body }, extractOpenAI, options);
  }

  stream(prompt: string, options?: AIStreamOptions): AsyncIterable<string> {
    return this.streamRaw([{ role: 'user', content: `Reply with a json object. ${prompt}` }], options);
  }

  chat(system: string, messages: AIChatMessage[], options?: AIStreamOptions): AsyncIterable<string> {
    return this.streamRaw([
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ], options);
  }
}

export const OLLAMA_DEFAULT_URL = 'http://localhost:11434';
export const LMSTUDIO_DEFAULT_URL = 'http://localhost:1234';

export class OllamaAdapter extends LocalAdapter {
  constructor(baseUrl: string, model?: string) {
    super(baseUrl || OLLAMA_DEFAULT_URL, 'llama3.2', model);
  }

  getKeyGuide(language: string): string {
    const guides: Record<string, string> = {
      en: `## Running Ollama

> **Note:** Ollama runs on your computer (Windows, Mac, or Linux). It cannot run on a phone or tablet.

1. Go to [ollama.com](https://ollama.com) and download the installer for your OS
2. Install and launch Ollama — it runs as a background service
3. Open a terminal and pull a model:
   \`\`\`
   ollama pull llama3.2
   \`\`\`
4. Ollama is now available at \`http://localhost:11434\`
5. Paste that URL above and click **Connect**

> You can pull other models too: \`ollama pull mistral\`, \`ollama pull gemma3\`, etc.`,

      tr: `## Ollama Kurulumu

> **Not:** Ollama bilgisayarınızda (Windows, Mac veya Linux) çalışır. Telefon veya tablette çalışmaz.

1. [ollama.com](https://ollama.com) adresine gidin ve işletim sisteminize uygun yükleyiciyi indirin
2. Ollama'yı kurun ve başlatın — arka planda bir servis olarak çalışır
3. Bir terminal açın ve model indirin:
   \`\`\`
   ollama pull llama3.2
   \`\`\`
4. Ollama artık \`http://localhost:11434\` adresinde kullanılabilir
5. Bu URL'yi yukarıya yapıştırın ve **Bağlan** butonuna tıklayın

> Başka modeller de indirebilirsiniz: \`ollama pull mistral\`, \`ollama pull gemma3\`, vb.`,

      ar: `## تشغيل Ollama

> **ملاحظة:** يعمل Ollama على جهاز الكمبيوتر (Windows أو Mac أو Linux). لا يمكنه العمل على الهاتف أو الجهاز اللوحي.

1. اذهب إلى [ollama.com](https://ollama.com) وحمّل المثبّت المناسب لنظامك
2. قم بتثبيت Ollama وتشغيله — يعمل كخدمة في الخلفية
3. افتح نافذة طرفية وحمّل نموذجاً:
   \`\`\`
   ollama pull llama3.2
   \`\`\`
4. أصبح Ollama متاحاً على \`http://localhost:11434\`
5. الصق هذا الرابط أعلاه واضغط **اتصال**

> يمكنك تحميل نماذج أخرى أيضاً: \`ollama pull mistral\`، \`ollama pull gemma3\`، إلخ.`,

      fr: `## Lancer Ollama

> **Remarque :** Ollama fonctionne sur votre ordinateur (Windows, Mac ou Linux). Il ne peut pas fonctionner sur un téléphone ou une tablette.

1. Rendez-vous sur [ollama.com](https://ollama.com) et téléchargez le programme d'installation pour votre OS
2. Installez et lancez Ollama — il fonctionne en arrière-plan
3. Ouvrez un terminal et téléchargez un modèle :
   \`\`\`
   ollama pull llama3.2
   \`\`\`
4. Ollama est maintenant disponible sur \`http://localhost:11434\`
5. Collez cette URL ci-dessus et cliquez sur **Connecter**

> Vous pouvez aussi télécharger d'autres modèles : \`ollama pull mistral\`, \`ollama pull gemma3\`, etc.`,
    };
    return guides[language] ?? guides.en;
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

  getKeyGuide(language: string): string {
    const guides: Record<string, string> = {
      en: `## Running LM Studio

> **Note:** LM Studio runs on your computer (Windows, Mac, or Linux). It cannot run on a phone or tablet.

1. Go to [lmstudio.ai](https://lmstudio.ai) and download the app for your OS
2. Install and open LM Studio
3. Search for a model in the **Discover** tab (e.g. \`gemma\`, \`llama\`, \`mistral\`) and download one
4. Go to the **Local Server** tab (left sidebar)
5. Select your downloaded model and click **Start Server**
6. LM Studio is now available at \`http://localhost:1234\`
7. Paste that URL above and click **Connect**`,

      tr: `## LM Studio Kurulumu

> **Not:** LM Studio bilgisayarınızda (Windows, Mac veya Linux) çalışır. Telefon veya tablette çalışmaz.

1. [lmstudio.ai](https://lmstudio.ai) adresine gidin ve işletim sisteminize uygun uygulamayı indirin
2. LM Studio'yu kurun ve açın
3. **Discover** sekmesinde bir model arayın (örn. \`gemma\`, \`llama\`, \`mistral\`) ve indirin
4. Sol kenar çubuğundaki **Local Server** sekmesine gidin
5. İndirdiğiniz modeli seçin ve **Start Server** butonuna tıklayın
6. LM Studio artık \`http://localhost:1234\` adresinde kullanılabilir
7. Bu URL'yi yukarıya yapıştırın ve **Bağlan** butonuna tıklayın`,

      ar: `## تشغيل LM Studio

> **ملاحظة:** يعمل LM Studio على جهاز الكمبيوتر (Windows أو Mac أو Linux). لا يمكنه العمل على الهاتف أو الجهاز اللوحي.

1. اذهب إلى [lmstudio.ai](https://lmstudio.ai) وحمّل التطبيق المناسب لنظامك
2. قم بتثبيت LM Studio وفتحه
3. ابحث عن نموذج في تبويب **Discover** (مثل \`gemma\` أو \`llama\` أو \`mistral\`) وحمّله
4. اذهب إلى تبويب **Local Server** في الشريط الجانبي
5. اختر النموذج الذي حمّلته واضغط **Start Server**
6. أصبح LM Studio متاحاً على \`http://localhost:1234\`
7. الصق هذا الرابط أعلاه واضغط **اتصال**`,

      fr: `## Lancer LM Studio

> **Remarque :** LM Studio fonctionne sur votre ordinateur (Windows, Mac ou Linux). Il ne peut pas fonctionner sur un téléphone ou une tablette.

1. Rendez-vous sur [lmstudio.ai](https://lmstudio.ai) et téléchargez l'application pour votre OS
2. Installez et ouvrez LM Studio
3. Recherchez un modèle dans l'onglet **Discover** (ex. \`gemma\`, \`llama\`, \`mistral\`) et téléchargez-en un
4. Allez dans l'onglet **Local Server** (barre latérale gauche)
5. Sélectionnez le modèle téléchargé et cliquez sur **Start Server**
6. LM Studio est maintenant disponible sur \`http://localhost:1234\`
7. Collez cette URL ci-dessus et cliquez sur **Connecter**`,
    };
    return guides[language] ?? guides.en;
  }

  async getModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/v1/models`);
    if (!res.ok) throw new Error(`LM Studio models error ${res.status}`);
    const data = await res.json();
    return (data.data as { id: string }[]).map(m => m.id).sort();
  }
}

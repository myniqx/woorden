interface TranslationResult {
  en?: string;
  fr?: string;
}

// Use Vite proxy in dev mode to avoid CORS issues
const DEEPL_API_URL = '/api/deepl/v2/translate';

// DeepL does not support Arabic (AR), so we only translate to EN and FR
const TARGET_LANGS = [
  { code: 'EN-US', key: 'en' },
  { code: 'FR', key: 'fr' },
] as const;

export async function translateWithDeepL(
  text: string,
  apiKey: string
): Promise<TranslationResult> {
  const result: TranslationResult = {};

  for (const { code, key } of TARGET_LANGS) {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: 'NL',
        target_lang: code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait and try again.');
      }
      throw new Error(`DeepL API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (data.translations && data.translations[0]) {
      result[key] = data.translations[0].text;
    }
  }

  return result;
}

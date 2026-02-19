import { useState, useEffect } from 'preact/hooks';
import type { WordEntry, Article } from '../types/word';
import { translateWithDeepL } from '../services/deepl';
import './EditorPage.css';

interface EditorWord extends Partial<WordEntry> {
  nl: string;
  tr?: string;
}

interface DuplicateWord {
  newWord: EditorWord;
  existingIndex: number;
}

const STORAGE_KEY = 'woorden_editor_data';

function parseHtmlTable(html: string): EditorWord[] {
  const result: EditorWord[] = [];

  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const trMatches = html.matchAll(trRegex);

  for (const trMatch of trMatches) {
    const trContent = trMatch[1];

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tdMatches = Array.from(trContent.matchAll(tdRegex));

    if (tdMatches.length >= 3) {
      const td2Content = tdMatches[1][1];
      const td3Content = tdMatches[2][1];

      const rawWord = td2Content.replace(/<[^>]+>/g, '').trim();
      const translation = td3Content.replace(/<[^>]+>/g, '').trim();

      if (rawWord && translation) {
        // Parse article if present (e.g., "dorp, het" or "hond, de")
        let nl = rawWord;
        let article: Article | undefined;

        const articleMatch = rawWord.match(/^(.+?)\s*,\s*(de|het)$/i);
        if (articleMatch) {
          nl = articleMatch[1].trim();
          article = articleMatch[2].toLowerCase() as Article;
        }

        const word: EditorWord = {
          nl,
          tr: translation,
        };

        if (article) {
          (word as any).type = 'noun';
          (word as any).article = article;
        }

        result.push(word);
      }
    }
  }

  return result;
}

function wordToJson(word: EditorWord): Partial<WordEntry> {
  const entry: Partial<WordEntry> = {
    nl: word.nl,
  };

  if (word.type) entry.type = word.type;
  if ((word as any).article) (entry as any).article = (word as any).article;
  if ((word as any).perfectum) (entry as any).perfectum = (word as any).perfectum;
  if ((word as any).imperfectum) (entry as any).imperfectum = (word as any).imperfectum;
  if ((word as any).diminutive) (entry as any).diminutive = (word as any).diminutive;
  if (word.tr) entry.tr = word.tr;
  if (word.en) entry.en = word.en;
  if (word.ar) entry.ar = word.ar;
  if (word.fr) entry.fr = word.fr;

  return entry;
}

export function EditorPage() {
  const [inputHtml, setInputHtml] = useState('');
  const [words, setWords] = useState<EditorWord[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState({ current: 0, total: 0 });
  const [duplicates, setDuplicates] = useState<DuplicateWord[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setWords(data.words || []);
        setInputHtml(data.inputHtml || '');
      } catch (e) {
        console.error('Failed to load editor data:', e);
      }
    }
  }, []);

  // Save to localStorage when words change
  useEffect(() => {
    if (words.length > 0 || inputHtml) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ words, inputHtml }));
    }
  }, [words, inputHtml]);

  const handleConvert = () => {
    const parsed = parseHtmlTable(inputHtml);

    const newWords: EditorWord[] = [];
    const foundDuplicates: DuplicateWord[] = [];

    for (const newWord of parsed) {
      const existingIndex = words.findIndex(w => w.nl.toLowerCase() === newWord.nl.toLowerCase());

      if (existingIndex !== -1) {
        foundDuplicates.push({ newWord, existingIndex });
      } else {
        // Check if already added in this batch
        const batchDupe = newWords.findIndex(w => w.nl.toLowerCase() === newWord.nl.toLowerCase());
        if (batchDupe === -1) {
          newWords.push(newWord);
        }
      }
    }

    // Add non-duplicate words
    if (newWords.length > 0) {
      setWords(prev => [...prev, ...newWords]);
    }

    // Show duplicates modal if any
    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates);
      setShowDuplicateModal(true);
    }

    // Clear input
    setInputHtml('');
  };

  const handleDuplicateAction = (action: 'replace' | 'skip' | 'keep-both') => {
    if (duplicates.length === 0) return;

    const current = duplicates[0];

    setWords(prev => {
      const updated = [...prev];
      if (action === 'replace') {
        updated[current.existingIndex] = current.newWord;
      } else if (action === 'keep-both') {
        updated.push(current.newWord);
      }
      // 'skip' does nothing
      return updated;
    });

    // Move to next duplicate
    const remaining = duplicates.slice(1);
    if (remaining.length > 0) {
      setDuplicates(remaining);
    } else {
      setDuplicates([]);
      setShowDuplicateModal(false);
    }
  };

  const handleSkipAllDuplicates = () => {
    setDuplicates([]);
    setShowDuplicateModal(false);
  };

  const handleTranslate = async () => {
    const apiKey = import.meta.env.VITE_DEEPL_API_KEY;
    if (!apiKey) {
      alert('DeepL API key not found. Add VITE_DEEPL_API_KEY to .env file.');
      return;
    }

    setIsTranslating(true);
    // Only translate words missing EN or FR (DeepL doesn't support AR)
    const wordsToTranslate = words.filter(w => !w.en || !w.fr);

    if (wordsToTranslate.length === 0) {
      alert('All words already have EN and FR translations.');
      setIsTranslating(false);
      return;
    }

    setTranslateProgress({ current: 0, total: wordsToTranslate.length });

    let current = 0;
    const updatedWords = [...words];

    for (let i = 0; i < updatedWords.length; i++) {
      const word = updatedWords[i];
      // Skip if already has both translations
      if (word.en && word.fr) {
        continue;
      }

      try {
        const translations = await translateWithDeepL(word.nl, apiKey);

        // Check if translation failed (empty result means API error)
        if (!translations.en && !translations.fr) {
          throw new Error('Empty translation result');
        }

        console.log(`Translated "${word.nl}":`, translations);
        updatedWords[i] = { ...word, ...translations };
        current++;
        setTranslateProgress({ current, total: wordsToTranslate.length });
        setWords([...updatedWords]);
      } catch (e) {
        console.error(`Failed to translate "${word.nl}":`, e);
        setIsTranslating(false);
        alert(`Translation stopped at "${word.nl}". ${current} words translated successfully.\n\nError: ${e instanceof Error ? e.message : 'Unknown error'}`);
        return;
      }
    }

    setIsTranslating(false);
    alert(`Translation complete! ${current} words translated.`);
  };

  const handleExport = () => {
    const chunkSize = 100;
    const chunks: Partial<WordEntry>[][] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).map(wordToJson));
    }

    chunks.forEach((chunk, index) => {
      const blob = new Blob([JSON.stringify(chunk, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `words-${index + 1}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all words?')) {
      setWords([]);
      setInputHtml('');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const removeWord = (index: number) => {
    setWords(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="editor-page">
      <div class="editor-header">
        <h1>Word Editor</h1>
        <span class="editor-badge">DEV ONLY</span>
      </div>

      <div class="editor-panels">
        <div class="editor-panel input-panel">
          <h2>HTML Input</h2>
          <textarea
            value={inputHtml}
            onInput={(e) => setInputHtml((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste HTML table rows here..."
          />
        </div>

        <div class="editor-panel output-panel">
          <div class="output-header">
            <h2>Words ({words.length})</h2>
            <div class="output-actions">
              <button onClick={handleConvert} class="btn btn-convert">
                Convert
              </button>
              <button
                onClick={handleTranslate}
                class="btn btn-translate"
                disabled={isTranslating || words.length === 0}
              >
                {isTranslating
                  ? `Translating... (${translateProgress.current}/${translateProgress.total})`
                  : 'Translate'
                }
              </button>
              <button
                onClick={handleExport}
                class="btn btn-export"
                disabled={words.length === 0}
              >
                Export
              </button>
              <button
                onClick={handleClear}
                class="btn btn-clear"
                disabled={words.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          <div class="words-list">
            {words.map((word, index) => (
              <div key={index} class="word-card">
                <button
                  class="word-remove"
                  onClick={() => removeWord(index)}
                  title="Remove word"
                >
                  ×
                </button>
                <pre>{JSON.stringify(wordToJson(word), null, 2)}</pre>
              </div>
            ))}
            {words.length === 0 && (
              <div class="empty-state">
                No words yet. Paste HTML and click Convert.
              </div>
            )}
          </div>
        </div>
      </div>

      {showDuplicateModal && duplicates.length > 0 && (
        <div class="duplicate-modal-overlay">
          <div class="duplicate-modal">
            <div class="duplicate-modal-header">
              <h3>Duplicate Found ({duplicates.length} remaining)</h3>
              <button class="btn btn-clear" onClick={handleSkipAllDuplicates}>
                Skip All
              </button>
            </div>

            <div class="duplicate-comparison">
              <div class="duplicate-side">
                <h4>Existing</h4>
                <pre>{JSON.stringify(wordToJson(words[duplicates[0].existingIndex]), null, 2)}</pre>
              </div>
              <div class="duplicate-side">
                <h4>New</h4>
                <pre>{JSON.stringify(wordToJson(duplicates[0].newWord), null, 2)}</pre>
              </div>
            </div>

            <div class="duplicate-actions">
              <button class="btn btn-convert" onClick={() => handleDuplicateAction('replace')}>
                Replace with New
              </button>
              <button class="btn btn-translate" onClick={() => handleDuplicateAction('keep-both')}>
                Keep Both
              </button>
              <button class="btn btn-export" onClick={() => handleDuplicateAction('skip')}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

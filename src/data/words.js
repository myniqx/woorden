import wordsData from './woorden.json';

// Process words and add unique IDs
export const words = wordsData.map((word, index) => ({
  id: index,
  ...word,
  // Extract article (de/het) if exists
  article: extractArticle(word.nl),
  // Clean word without article
  word: cleanWord(word.nl)
}));

function extractArticle(nl) {
  const match = nl.match(/,\s*(de|het)$/);
  return match ? match[1] : null;
}

function cleanWord(nl) {
  return nl.replace(/,\s*(de|het)$/, '').trim();
}

// Get only words with articles (for article quiz)
export const wordsWithArticles = words.filter(w => w.article !== null);

// Available languages
export const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export default words;

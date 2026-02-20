import type { Language } from '../types';

type TranslationKey =
  | 'streak'
  | 'quiz_nativeToDutch'
  | 'quiz_dutchToNative'
  | 'quiz_article'
  | 'quiz_nativeToDutch_desc'
  | 'quiz_dutchToNative_desc'
  | 'quiz_article_desc'
  | 'selectQuizType'
  | 'back'
  | 'whatIsDutch'
  | 'whatIsArticle'
  | 'correct'
  | 'incorrect'
  | 'todayPracticed'
  | 'unseen'
  | 'learning'
  | 'mastered'
  | 'difficult'
  | 'todayProgress'
  | 'words'
  | 'accuracy'
  | 'daySeries'
  | 'unseenWords'
  | 'learningWords'
  | 'masteredWords'
  | 'difficultWords'
  | 'emptyCategory'
  | 'wordPool'
  | 'wordPoolDesc'
  | 'wordsSelected'
  | 'pack'
  | 'type_noun'
  | 'type_verb'
  | 'type_adj'
  | 'type_adv'
  | 'type_prep'
  | 'type_conj'
  | 'type_phrase'
  | 'type_num'
  | 'type_pron'
  | 'pinnedWords'
  | 'pinnedWordsDesc'
  | 'pinnedWordsDisabled'
  | 'quiz_nativeToDutch_write'
  | 'quiz_nativeToDutch_write_desc'
  | 'quiz_verbForms'
  | 'quiz_verbForms_desc'
  | 'writeTheDutch'
  | 'writeThePerfectum'
  | 'writeTheImperfectum'
  | 'skip'
  | 'correctAnswer';

type Translations = Record<Language, Record<TranslationKey, string>>;

export const translations: Translations = {
  tr: {
    streak: 'Günlük seri',
    selectQuizType: 'Test Türü Seç',
    quiz_nativeToDutch: 'Türkçe → Hollandaca',
    quiz_dutchToNative: 'Hollandaca → Türkçe',
    quiz_article: 'Artikel Testi',
    quiz_nativeToDutch_desc: 'Kelimenin Hollandaca karşılığını seç',
    quiz_dutchToNative_desc: 'Hollandaca kelimenin anlamını seç',
    quiz_article_desc: "Kelimenin artikel'ini seç (de/het)",
    back: 'Geri',
    whatIsDutch: "Hollandaca'da ne demek?",
    whatIsArticle: "Bu kelimenin artikel'i nedir?",
    correct: 'Doğru!',
    incorrect: 'Yanlış',
    todayPracticed: 'Bugün: {count} kelime',
    unseen: 'Yeni',
    learning: 'Öğreniliyor',
    mastered: 'Öğrenildi',
    difficult: 'Zor',
    todayProgress: 'Bugünkü İlerleme',
    words: 'kelime',
    accuracy: 'doğruluk',
    daySeries: 'gün seri',
    unseenWords: 'Yeni Kelimeler',
    learningWords: 'Öğrenilen Kelimeler',
    masteredWords: 'Bilinen Kelimeler',
    difficultWords: 'Zor Kelimeler',
    emptyCategory: 'Bu kategoride kelime yok',
    wordPool: 'Kelime Havuzu',
    wordPoolDesc: '{count} kelime secili',
    wordsSelected: '{count} kelime',
    pack: 'Paket {num}',
    type_noun: 'isim',
    type_verb: 'fiil',
    type_adj: 'sıfat',
    type_adv: 'zarf',
    type_prep: 'edat',
    type_conj: 'bağlaç',
    type_phrase: 'deyim',
    type_num: 'sayı',
    type_pron: 'zamir',
    pinnedWords: 'Pinli Kelimeler',
    pinnedWordsDesc: '{count} kelime pinli',
    pinnedWordsDisabled: '{count} kelime pinleyin, 10 olsun',
    quiz_nativeToDutch_write: 'Yazma Testi',
    quiz_nativeToDutch_write_desc: 'Hollandaca karşılığını yaz',
    quiz_verbForms: 'Fiil Formları',
    quiz_verbForms_desc: 'Perfectum veya imperfectum yaz',
    writeTheDutch: 'Hollandaca karşılığını yazın',
    writeThePerfectum: 'Perfectum halini yazın',
    writeTheImperfectum: 'Imperfectum halini yazın',
    skip: 'Geç',
    correctAnswer: 'Doğrusu: {answer}',
  },

  en: {
    streak: 'Daily streak',
    selectQuizType: 'Select Quiz Type',
    quiz_nativeToDutch: 'English → Dutch',
    quiz_dutchToNative: 'Dutch → English',
    quiz_article: 'Article Test',
    quiz_nativeToDutch_desc: 'Select the Dutch translation',
    quiz_dutchToNative_desc: 'Select the meaning of the Dutch word',
    quiz_article_desc: 'Select the article (de/het)',
    back: 'Back',
    whatIsDutch: 'What is it in Dutch?',
    whatIsArticle: 'What is the article?',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    todayPracticed: 'Today: {count} words',
    unseen: 'New',
    learning: 'Learning',
    mastered: 'Mastered',
    difficult: 'Difficult',
    todayProgress: "Today's Progress",
    words: 'words',
    accuracy: 'accuracy',
    daySeries: 'day streak',
    unseenWords: 'New Words',
    learningWords: 'Learning Words',
    masteredWords: 'Mastered Words',
    difficultWords: 'Difficult Words',
    emptyCategory: 'No words in this category',
    wordPool: 'Word Pool',
    wordPoolDesc: '{count} words selected',
    wordsSelected: '{count} words',
    pack: 'Pack {num}',
    type_noun: 'noun',
    type_verb: 'verb',
    type_adj: 'adjective',
    type_adv: 'adverb',
    type_prep: 'preposition',
    type_conj: 'conjunction',
    type_phrase: 'phrase',
    type_num: 'number',
    type_pron: 'pronoun',
    pinnedWords: 'Pinned Words',
    pinnedWordsDesc: '{count} words pinned',
    pinnedWordsDisabled: 'Pin {count} more to reach 10',
    quiz_nativeToDutch_write: 'Writing Test',
    quiz_nativeToDutch_write_desc: 'Write the Dutch translation',
    quiz_verbForms: 'Verb Forms',
    quiz_verbForms_desc: 'Write perfectum or imperfectum',
    writeTheDutch: 'Write the Dutch word',
    writeThePerfectum: 'Write the perfectum form',
    writeTheImperfectum: 'Write the imperfectum form',
    skip: 'Skip',
    correctAnswer: 'Correct: {answer}',
  },

  ar: {
    streak: 'السلسلة اليومية',
    selectQuizType: 'اختر نوع الاختبار',
    quiz_nativeToDutch: 'عربي ← هولندي',
    quiz_dutchToNative: 'هولندي ← عربي',
    quiz_article: 'اختبار الأداة',
    quiz_nativeToDutch_desc: 'اختر الترجمة الهولندية',
    quiz_dutchToNative_desc: 'اختر معنى الكلمة الهولندية',
    quiz_article_desc: '(de/het) اختر الأداة',
    back: 'رجوع',
    whatIsDutch: 'ما هي بالهولندية؟',
    whatIsArticle: 'ما هي أداة هذه الكلمة؟',
    correct: '!صحيح',
    incorrect: 'خطأ',
    todayPracticed: 'اليوم: {count} كلمة',
    unseen: 'جديد',
    learning: 'قيد التعلم',
    mastered: 'تم إتقانها',
    difficult: 'صعب',
    todayProgress: 'تقدم اليوم',
    words: 'كلمات',
    accuracy: 'دقة',
    daySeries: 'يوم متتالي',
    unseenWords: 'كلمات جديدة',
    learningWords: 'كلمات قيد التعلم',
    masteredWords: 'كلمات متقنة',
    difficultWords: 'كلمات صعبة',
    emptyCategory: 'لا توجد كلمات في هذه الفئة',
    wordPool: 'مجموعة الكلمات',
    wordPoolDesc: '{count} كلمة مختارة',
    wordsSelected: '{count} كلمة',
    pack: 'حزمة {num}',
    type_noun: 'اسم',
    type_verb: 'فعل',
    type_adj: 'صفة',
    type_adv: 'ظرف',
    type_prep: 'حرف جر',
    type_conj: 'حرف عطف',
    type_phrase: 'عبارة',
    type_num: 'رقم',
    type_pron: 'ضمير',
    pinnedWords: 'كلمات مثبتة',
    pinnedWordsDesc: '{count} كلمة مثبتة',
    pinnedWordsDisabled: 'ثبت {count} كلمة أخرى للوصول إلى 10',
    quiz_nativeToDutch_write: 'اختبار الكتابة',
    quiz_nativeToDutch_write_desc: 'اكتب الترجمة الهولندية',
    quiz_verbForms: 'صيغ الفعل',
    quiz_verbForms_desc: 'اكتب الماضي أو الماضي التام',
    writeTheDutch: 'اكتب الكلمة بالهولندية',
    writeThePerfectum: 'اكتب صيغة الماضي التام',
    writeTheImperfectum: 'اكتب صيغة الماضي',
    skip: 'تخطي',
    correctAnswer: 'الصحيح: {answer}',
  },

  fr: {
    streak: 'Série quotidienne',
    selectQuizType: 'Choisir le type de quiz',
    quiz_nativeToDutch: 'Français → Néerlandais',
    quiz_dutchToNative: 'Néerlandais → Français',
    quiz_article: "Test d'article",
    quiz_nativeToDutch_desc: 'Choisissez la traduction néerlandaise',
    quiz_dutchToNative_desc: 'Choisissez la signification du mot',
    quiz_article_desc: "Choisissez l'article (de/het)",
    back: 'Retour',
    whatIsDutch: 'Comment dit-on en néerlandais ?',
    whatIsArticle: "Quel est l'article ?",
    correct: 'Correct !',
    incorrect: 'Incorrect',
    todayPracticed: "Aujourd'hui : {count} mots",
    unseen: 'Nouveau',
    learning: 'En cours',
    mastered: 'Maîtrisé',
    difficult: 'Difficile',
    todayProgress: 'Progrès du jour',
    words: 'mots',
    accuracy: 'précision',
    daySeries: 'jours de suite',
    unseenWords: 'Nouveaux mots',
    learningWords: 'Mots en apprentissage',
    masteredWords: 'Mots maîtrisés',
    difficultWords: 'Mots difficiles',
    emptyCategory: 'Aucun mot dans cette catégorie',
    wordPool: 'Groupe de mots',
    wordPoolDesc: '{count} mots selectionnes',
    wordsSelected: '{count} mots',
    pack: 'Pack {num}',
    type_noun: 'nom',
    type_verb: 'verbe',
    type_adj: 'adjectif',
    type_adv: 'adverbe',
    type_prep: 'préposition',
    type_conj: 'conjonction',
    type_phrase: 'expression',
    type_num: 'nombre',
    type_pron: 'pronom',
    pinnedWords: 'Mots épinglés',
    pinnedWordsDesc: '{count} mots épinglés',
    pinnedWordsDisabled: 'Épinglez {count} de plus pour atteindre 10',
    quiz_nativeToDutch_write: 'Test d\'écriture',
    quiz_nativeToDutch_write_desc: 'Écrivez la traduction néerlandaise',
    quiz_verbForms: 'Formes verbales',
    quiz_verbForms_desc: 'Écrivez le perfectum ou imperfectum',
    writeTheDutch: 'Écrivez le mot en néerlandais',
    writeThePerfectum: 'Écrivez la forme perfectum',
    writeTheImperfectum: 'Écrivez la forme imperfectum',
    skip: 'Passer',
    correctAnswer: 'Correct: {answer}',
  },
};

export function t(
  key: string,
  lang: Language,
  replacements: Record<string, string | number> = {}
): string {
  let text = translations[lang]?.[key as TranslationKey] || translations['en'][key as TranslationKey] || key;

  Object.keys(replacements).forEach((placeholder) => {
    text = text.replace(`{${placeholder}}`, String(replacements[placeholder]));
  });

  return text;
}

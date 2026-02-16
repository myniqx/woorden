export const translations = {
  tr: {
    // Header
    streak: 'Günlük seri',

    // Quiz types
    quizNativeToDutch: 'Türkçe → Hollandaca',
    quizDutchToNative: 'Hollandaca → Türkçe',
    quizArticle: 'Artikel Testi',
    quizNativeToDutchDesc: 'Kelimenin Hollandaca karşılığını seç',
    quizDutchToNativeDesc: 'Hollandaca kelimenin anlamını seç',
    quizArticleDesc: "Kelimenin artikel'ini seç (de/het)",

    // Quiz
    back: '← Geri',
    whatIsDutch: 'Hollandaca\'da ne demek?',
    whatIsArticle: "Bu kelimenin artikel'i nedir?",
    correct: '✓ Doğru!',
    wrong: '✗ Yanlış',
    todayPracticed: 'Bugün: {count} kelime çalışıldı',

    // Stats
    unseen: 'Görülmemiş',
    learning: 'Öğreniliyor',
    mastered: 'Öğrenilmiş',
    todayProgress: 'Bugünkü İlerleme',
    words: 'kelime',
    accuracy: 'doğruluk',
    daySeries: 'gün seri',

    // Modal
    unseenWords: '📚 Görülmemiş Kelimeler',
    learningWords: '📈 Öğreniliyor',
    masteredWords: '⭐ Öğrenilmiş',
    unseenDesc: 'Henüz hiç çalışılmamış kelimeler (alfabetik sıralı)',
    learningDesc: 'Çalışılan ama henüz tam öğrenilmemiş kelimeler (en çok hata yapılandan başlayarak)',
    masteredDesc: 'Öğrenilmiş kelimeler (en çok doğru yapılandan başlayarak)',
    emptyCategory: 'Bu kategoride kelime yok'
  },

  en: {
    // Header
    streak: 'Daily streak',

    // Quiz types
    quizNativeToDutch: 'English → Dutch',
    quizDutchToNative: 'Dutch → English',
    quizArticle: 'Article Test',
    quizNativeToDutchDesc: 'Select the Dutch translation',
    quizDutchToNativeDesc: 'Select the meaning of the Dutch word',
    quizArticleDesc: 'Select the article (de/het)',

    // Quiz
    back: '← Back',
    whatIsDutch: 'What is it in Dutch?',
    whatIsArticle: 'What is the article of this word?',
    correct: '✓ Correct!',
    wrong: '✗ Wrong',
    todayPracticed: 'Today: {count} words practiced',

    // Stats
    unseen: 'Unseen',
    learning: 'Learning',
    mastered: 'Mastered',
    todayProgress: "Today's Progress",
    words: 'words',
    accuracy: 'accuracy',
    daySeries: 'day streak',

    // Modal
    unseenWords: '📚 Unseen Words',
    learningWords: '📈 Learning',
    masteredWords: '⭐ Mastered',
    unseenDesc: 'Words you haven\'t practiced yet (alphabetically sorted)',
    learningDesc: 'Words you\'re still learning (sorted by most errors)',
    masteredDesc: 'Words you\'ve mastered (sorted by most correct)',
    emptyCategory: 'No words in this category'
  },

  ar: {
    // Header
    streak: 'السلسلة اليومية',

    // Quiz types
    quizNativeToDutch: 'عربي ← هولندي',
    quizDutchToNative: 'هولندي ← عربي',
    quizArticle: 'اختبار الأداة',
    quizNativeToDutchDesc: 'اختر الترجمة الهولندية',
    quizDutchToNativeDesc: 'اختر معنى الكلمة الهولندية',
    quizArticleDesc: '(de/het) اختر الأداة',

    // Quiz
    back: '→ رجوع',
    whatIsDutch: 'ما هي بالهولندية؟',
    whatIsArticle: 'ما هي أداة هذه الكلمة؟',
    correct: '✓ !صحيح',
    wrong: '✗ خطأ',
    todayPracticed: 'اليوم: {count} كلمة تمت دراستها',

    // Stats
    unseen: 'لم تُرَ',
    learning: 'قيد التعلم',
    mastered: 'تم إتقانها',
    todayProgress: 'تقدم اليوم',
    words: 'كلمات',
    accuracy: 'دقة',
    daySeries: 'يوم متتالي',

    // Modal
    unseenWords: '📚 كلمات لم تُرَ',
    learningWords: '📈 قيد التعلم',
    masteredWords: '⭐ تم إتقانها',
    unseenDesc: 'كلمات لم تتم دراستها بعد (مرتبة أبجدياً)',
    learningDesc: 'كلمات لا تزال قيد التعلم (مرتبة حسب الأخطاء)',
    masteredDesc: 'كلمات تم إتقانها (مرتبة حسب الإجابات الصحيحة)',
    emptyCategory: 'لا توجد كلمات في هذه الفئة'
  }
};

export function t(key, lang, replacements = {}) {
  let text = translations[lang]?.[key] || translations['en'][key] || key;

  // Replace placeholders like {count}
  Object.keys(replacements).forEach(placeholder => {
    text = text.replace(`{${placeholder}}`, replacements[placeholder]);
  });

  return text;
}

export default translations;

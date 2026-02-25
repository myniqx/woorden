import { useState, useEffect, useCallback } from 'preact/hooks';
import { Pin, Eye, Check, X, Flame, HelpCircle } from 'lucide-preact';
import type { QuizType, QuizMode, Language, Quiz } from '../types';
import { createQuiz, submitAnswer } from '../services/quiz';
import { t } from '../data/translations';
import { canPinInQuizType, isPinned, togglePin, getSkillProgress, getSkillForQuizType } from '../services/storage';
import { OptionButton } from './OptionButton';
import { HelpModal } from './HelpModal';
import './QuizScreen.css';

const helpTexts: Record<QuizType, Record<Language, { title: string; content: string }>> = {
  nativeToDutch: {
    tr: {
      title: 'Nasıl Oynanır?',
      content: `**Sol üstte** kelimenin türü (isim, fiil vb.) gösterilir.

Sorulan kelimenin **Hollandaca karşılığını** seçeneklerden bulup seçin. Doğru veya yanlış cevapladığınızda bir sonraki kelimeye geçilir.

Siz çıkana kadar sorular tekrar tekrar karşınıza gelir. **Alt kısımdaki istatistiklerden** gelişiminizi takip edebilirsiniz.

Kelimeler kolay gelmeye başladıysa, **kelime havuzundan** yeni paketler ekleyebilir veya bir üst seviyeye geçebilirsiniz.`,
    },
    en: {
      title: 'How to Play?',
      content: `**Top left** shows the word type (noun, verb, etc.).

Find and select the **Dutch translation** from the options. After answering, you move to the next word.

Questions repeat until you exit. Track your progress in the **stats below**.

When words become easy, add new packs from the **word pool** or move to the next level.`,
    },
    ar: {
      title: 'كيف تلعب؟',
      content: `**أعلى اليسار** يظهر نوع الكلمة (اسم، فعل، إلخ).

ابحث عن **الترجمة الهولندية** من الخيارات. بعد الإجابة، تنتقل للكلمة التالية.

تتكرر الأسئلة حتى تخرج. تابع تقدمك في **الإحصائيات أدناه**.`,
    },
    fr: {
      title: 'Comment jouer?',
      content: `**En haut à gauche** affiche le type de mot (nom, verbe, etc.).

Trouvez et sélectionnez la **traduction néerlandaise** parmi les options. Après avoir répondu, vous passez au mot suivant.

Les questions se répètent jusqu'à ce que vous quittiez. Suivez vos progrès dans les **statistiques ci-dessous**.`,
    },
  },
  dutchToNative: {
    tr: {
      title: 'Nasıl Oynanır?',
      content: `**Sol üstte** kelimenin türü (isim, fiil vb.) gösterilir.

Hollandaca kelimenin **anlamını** seçeneklerden bulup seçin. Doğru veya yanlış cevapladığınızda bir sonraki kelimeye geçilir.

Siz çıkana kadar sorular tekrar tekrar karşınıza gelir. **Alt kısımdaki istatistiklerden** gelişiminizi takip edebilirsiniz.

Kelimeler kolay gelmeye başladıysa, **kelime havuzundan** yeni paketler ekleyebilir veya bir üst seviyeye geçebilirsiniz.`,
    },
    en: {
      title: 'How to Play?',
      content: `**Top left** shows the word type (noun, verb, etc.).

Find and select the **meaning** of the Dutch word from the options. After answering, you move to the next word.

Questions repeat until you exit. Track your progress in the **stats below**.

When words become easy, add new packs from the **word pool** or move to the next level.`,
    },
    ar: {
      title: 'كيف تلعب؟',
      content: `**أعلى اليسار** يظهر نوع الكلمة (اسم، فعل، إلخ).

ابحث عن **معنى** الكلمة الهولندية من الخيارات. بعد الإجابة، تنتقل للكلمة التالية.

تتكرر الأسئلة حتى تخرج. تابع تقدمك في **الإحصائيات أدناه**.`,
    },
    fr: {
      title: 'Comment jouer?',
      content: `**En haut à gauche** affiche le type de mot (nom, verbe, etc.).

Trouvez et sélectionnez la **signification** du mot néerlandais parmi les options. Après avoir répondu, vous passez au mot suivant.

Les questions se répètent jusqu'à ce que vous quittiez. Suivez vos progrès dans les **statistiques ci-dessous**.`,
    },
  },
  article: {
    tr: {
      title: 'Nasıl Oynanır?',
      content: `Hollandaca'da isimler **"de"** veya **"het"** artikel alır.

Bu testte size bir isim gösterilir ve **doğru artikeli** seçmeniz istenir. Artikeller ezberlenmeli - genel kurallar olsa da çok sayıda istisna vardır.

Siz çıkana kadar sorular tekrar tekrar karşınıza gelir. **Alt kısımdaki istatistiklerden** gelişiminizi takip edebilirsiniz.`,
    },
    en: {
      title: 'How to Play?',
      content: `In Dutch, nouns take either **"de"** or **"het"** article.

In this test, you are shown a noun and asked to select the **correct article**. Articles must be memorized - while there are general rules, there are many exceptions.

Questions repeat until you exit. Track your progress in the **stats below**.`,
    },
    ar: {
      title: 'كيف تلعب؟',
      content: `في الهولندية، تأخذ الأسماء إما **"de"** أو **"het"**.

في هذا الاختبار، يُعرض عليك اسم وتُطلب منك اختيار **الأداة الصحيحة**. يجب حفظ الأدوات - رغم وجود قواعد عامة، هناك استثناءات كثيرة.`,
    },
    fr: {
      title: 'Comment jouer?',
      content: `En néerlandais, les noms prennent soit **"de"** soit **"het"**.

Dans ce test, on vous montre un nom et on vous demande de choisir le **bon article**. Les articles doivent être mémorisés - bien qu'il y ait des règles générales, il y a beaucoup d'exceptions.`,
    },
  },
  nativeToDutch_write: {
    tr: { title: '', content: '' },
    en: { title: '', content: '' },
    ar: { title: '', content: '' },
    fr: { title: '', content: '' },
  },
  verbForms: {
    tr: { title: '', content: '' },
    en: { title: '', content: '' },
    ar: { title: '', content: '' },
    fr: { title: '', content: '' },
  },
};

interface QuizScreenProps {
  quizType: QuizType;
  quizMode?: QuizMode;
  language: Language;
  onExit: () => void;
  onAnswer?: () => void;
}

export function QuizScreen({ quizType, quizMode = 'normal', language, onExit, onAnswer }: QuizScreenProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const tr = (key: string) => t(key, language);
  const canPin = canPinInQuizType(quizType);
  const help = helpTexts[quizType]?.[language] || helpTexts[quizType]?.en;

  const loadNewQuestion = useCallback(() => {
    const newQuiz = createQuiz(quizType, language, quizMode);
    setQuiz(newQuiz);
    setSelectedId(null);
    setShowResult(false);
    // Check if this word is pinned
    if (canPinInQuizType(quizType)) {
      setPinned(isPinned(quizType, newQuiz.word.nl));
    }
  }, [quizType, language, quizMode]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const handleOptionSelect = (optionId: string | number) => {
    if (showResult || !quiz) return;

    setSelectedId(optionId);
    const result = submitAnswer(quiz, optionId);
    setShowResult(true);
    onAnswer?.();

    // Auto-advance after delay
    setTimeout(() => {
      loadNewQuestion();
    }, 1500);
  };

  const handlePinToggle = () => {
    if (!quiz || !canPin) return;
    const newPinned = togglePin(quizType, quiz.word.nl);
    setPinned(newPinned);
  };

  if (!quiz) {
    return <div class="quiz-loading">Loading...</div>;
  }

  return (
    <div class="quiz-screen fade-in">
      <div class="quiz-card">
        <div class="question-section">
          <span class="question-type">{t(`type_${quiz.word.type}`, language)}</span>
          <div class="question-actions">
            {canPin && (
              <button
                class={`pin-button ${pinned ? 'pinned' : ''}`}
                onClick={handlePinToggle}
                aria-label={pinned ? 'Unpin word' : 'Pin word'}
              >
                <Pin size={18} />
              </button>
            )}
            {help?.content && (
              <button
                class="help-button"
                onClick={() => setShowHelp(true)}
                aria-label="Help"
              >
                <HelpCircle size={18} />
              </button>
            )}
          </div>
          <p class="question-text">{quiz.question.text}</p>
          {quiz.question.subtext && (
            <p class="question-subtext">{quiz.question.subtext}</p>
          )}
        </div>

        <div class="options-section">
          {quiz.options.map((option) => (
            <OptionButton
              key={`${quiz.word.nl}-${option.id}`}
              option={option}
              selected={selectedId === option.id}
              showResult={showResult}
              onClick={() => handleOptionSelect(option.id)}
            />
          ))}
        </div>
      </div>

      {showResult && (() => {
        const isCorrect = quiz.options.find(o => o.id === selectedId)?.isCorrect;
        const skill = getSkillForQuizType(quizType);
        const progress = getSkillProgress(quiz.word.nl, skill);

        return (
          <div class={`result-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div class="result-text">
              {isCorrect ? tr('correct') : `${tr('incorrect')} - ${quiz.word[language]}`}
            </div>
            <div class="result-stats">
              <span class="stat-item"><Eye size={14} /> {progress.seen}</span>
              <span class="stat-item correct"><Check size={14} /> {progress.correct}</span>
              <span class="stat-item incorrect"><X size={14} /> {progress.wrong}</span>
              <span class="stat-item streak"><Flame size={14} /> {progress.streak}</span>
            </div>
          </div>
        );
      })()}

      {showHelp && help?.content && (
        <HelpModal
          title={help.title}
          content={help.content}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}

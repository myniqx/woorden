import { useState, useEffect, useCallback } from 'preact/hooks';
import type { QuizType, QuizMode, Language, Quiz } from '../types';
import { createQuiz, submitAnswer } from '../services/quiz';
import { t } from '../data/translations';
import { canPinInQuizType, isPinned, togglePin, getSkillProgress, getSkillForQuizType } from '../services/storage';
import { OptionButton } from './OptionButton';
import { HelpModal } from './HelpModal';
import { ExampleZin } from './ExampleZin';
import { useLanguage } from '../hooks';
import { QuizCard, ResultBanner } from './commons';

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
  onExit: () => void;
  onAnswer?: () => void;
}

export function QuizScreen({ quizType, quizMode = 'normal', onExit, onAnswer }: QuizScreenProps) {
  const { language } = useLanguage();
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
    return <div class="flex flex-1 items-center justify-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  const skill = getSkillForQuizType(quizType);
  const progress = showResult ? getSkillProgress(quiz.word.nl, skill) : null;
  const isCorrect = showResult ? quiz.options.find(o => o.id === selectedId)?.isCorrect : null;

  return (
    <div class="flex-1 flex flex-col gap-[var(--spacing-lg)] py-[var(--spacing-md)] fade-in">
      <QuizCard
        wordType={t(`type_${quiz.word.type}`, language)}
        questionText={quiz.question.text}
        subtext={quiz.question.subtext}
        pinned={pinned}
        canPin={canPin}
        hasHelp={!!help?.content}
        onPinToggle={handlePinToggle}
        onHelpOpen={() => setShowHelp(true)}
        below={quiz.type === 'dutchToNative' ? <ExampleZin word={quiz.word} /> : undefined}
      >
        {quiz.options.map((option) => (
          <OptionButton
            key={`${quiz.word.nl}-${option.id}`}
            option={option}
            selected={selectedId === option.id}
            showResult={showResult}
            onClick={() => handleOptionSelect(option.id)}
          />
        ))}
      </QuizCard>

      {showResult && progress && (
        <ResultBanner
          isCorrect={!!isCorrect}
          text={isCorrect ? tr('correct') : `${tr('incorrect')} - ${quiz.word[language]}`}
          progress={progress}
        />
      )}

      {showHelp && help?.content && (
        <HelpModal title={help.title} content={help.content} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

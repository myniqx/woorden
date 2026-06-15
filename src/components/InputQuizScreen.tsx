import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { QuizType, QuizMode, Language } from '../types';
import { t } from '../data/translations';
import {
  canPinInQuizType,
  isPinned,
  togglePin,
  getSkillProgress,
  getSkillForQuizType,
  updateWordProgress,
} from '../services/storage';
import { selectWord } from '../services/wordSelector';
import { compareIgnoringAccents } from '../utils/textUtils';
import { HelpModal } from './HelpModal';
import { useLanguage } from '../hooks';
import { Button, QuizCard, ResultBanner } from './commons';

const helpTexts: Record<string, Record<Language, { title: string; content: string }>> = {
  nativeToDutch_write: {
    tr: {
      title: 'Nasıl Oynanır?',
      content: `Verilen kelimenin **Hollandaca karşılığını** yazın.

Yazdığınız **doğru ise** otomatik olarak bir sonraki soruya geçilir. Eğer geçilmediyse yazdığınız kelime uyuşmuyor demektir.

**"Geç"** tuşuna bastığınızda doğru cevabı görürsünüz ve bu kelime daha sonra karşınıza tekrar çıkar.

**Alt kısımdaki istatistiklerden** gelişiminizi takip edebilirsiniz.`,
    },
    en: {
      title: 'How to Play?',
      content: `Write the **Dutch translation** of the given word.

If your answer is **correct**, you automatically move to the next question. If not, your answer doesn't match.

Press **"Skip"** to see the correct answer - this word will appear again later.

Track your progress in the **stats below**.`,
    },
    ar: {
      title: 'كيف تلعب؟',
      content: `اكتب **الترجمة الهولندية** للكلمة المعطاة.

إذا كانت إجابتك **صحيحة**، تنتقل تلقائياً للسؤال التالي. إذا لم تنتقل، فإجابتك غير مطابقة.

اضغط **"تخطي"** لرؤية الإجابة الصحيحة - ستظهر هذه الكلمة مرة أخرى لاحقاً.`,
    },
    fr: {
      title: 'Comment jouer?',
      content: `Écrivez la **traduction néerlandaise** du mot donné.

Si votre réponse est **correcte**, vous passez automatiquement à la question suivante. Sinon, votre réponse ne correspond pas.

Appuyez sur **"Passer"** pour voir la bonne réponse - ce mot réapparaîtra plus tard.`,
    },
  },
  verbForms: {
    tr: {
      title: 'Nasıl Oynanır?',
      content: `Bu testte fiillerin **üç farklı hali** sorulur: mastar (infinitief), geçmiş zaman (imperfectum) ve bileşik geçmiş (perfectum).

Size bir form gösterilir (örn: **"gegaan"**) ve diğer formlardan birini yazmanız istenir.

Yazdığınız **doğru ise** otomatik olarak geçilir. **"Geç"** tuşuna basarsanız doğru cevabı görür ve kelime tekrar karşınıza çıkar.

**Örnek:** gaan (mastar) → ging (imperfectum) → gegaan (perfectum)`,
    },
    en: {
      title: 'How to Play?',
      content: `This test asks for **three verb forms**: infinitive (infinitief), simple past (imperfectum), and past participle (perfectum).

You're shown one form (e.g., **"gegaan"**) and asked to write another form.

If your answer is **correct**, you move on automatically. Press **"Skip"** to see the answer - the word will reappear later.

**Example:** gaan (infinitive) → ging (imperfectum) → gegaan (perfectum)`,
    },
    ar: {
      title: 'كيف تلعب؟',
      content: `يسأل هذا الاختبار عن **ثلاثة أشكال للفعل**: المصدر والماضي البسيط والماضي التام.

يُعرض عليك شكل واحد (مثل **"gegaan"**) وتُطلب منك كتابة شكل آخر.

إذا كانت إجابتك **صحيحة**، تنتقل تلقائياً. اضغط **"تخطي"** لرؤية الإجابة.`,
    },
    fr: {
      title: 'Comment jouer?',
      content: `Ce test demande **trois formes verbales**: infinitif, passé simple (imperfectum) et participe passé (perfectum).

On vous montre une forme (ex: **"gegaan"**) et on vous demande d'écrire une autre forme.

Si votre réponse est **correcte**, vous passez automatiquement. Appuyez sur **"Passer"** pour voir la réponse.`,
    },
  },
};

interface InputQuizScreenProps {
  quizType: QuizType;
  quizMode?: QuizMode;
  onExit: () => void;
  onAnswer?: () => void;
}

interface QuizState {
  wordNl: string;
  wordType: string;
  questionText: string;
  subtext: string;
  correctAnswer: string;
  perfectum?: string;
  imperfectum?: string;
}

export function InputQuizScreen({ quizType, quizMode = 'normal', onExit, onAnswer }: InputQuizScreenProps) {
  const { language } = useLanguage();
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canPin = canPinInQuizType(quizType);
  const help = helpTexts[quizType]?.[language] || helpTexts[quizType]?.en;

  const loadNewQuestion = useCallback(() => {
    let word;
    let questionText: string;
    let subtext: string;
    let correctAnswer: string;

    if (quizType === 'verbForms') {
      // Select a verb
      word = selectWord('verbForms', quizMode);

      const perfectum = 'perfectum' in word ? word.perfectum : '';
      const imperfectum = 'imperfectum' in word ? word.imperfectum : '';
      const infinitief = word.nl;

      // All 3 forms with their display and possible questions
      const forms = [
        {
          show: infinitief, label: 'infinitief', askOptions: [
            { answer: perfectum, key: 'writeThePerfectum' },
            { answer: imperfectum, key: 'writeTheImperfectum' },
          ]
        },
        {
          show: perfectum, label: 'perfectum', askOptions: [
            { answer: infinitief, key: 'writeTheInfinitief' },
            { answer: imperfectum, key: 'writeTheImperfectum' },
          ]
        },
        {
          show: imperfectum, label: 'imperfectum', askOptions: [
            { answer: infinitief, key: 'writeTheInfinitief' },
            { answer: perfectum, key: 'writeThePerfectum' },
          ]
        },
      ].filter(f => f.show); // Filter out empty forms

      // Pick a random form to show
      const chosen = forms[Math.floor(Math.random() * forms.length)];

      // Filter valid ask options and pick one
      const validOptions = chosen.askOptions.filter(opt => opt.answer);
      const askOption = validOptions[Math.floor(Math.random() * validOptions.length)];

      questionText = chosen.show;
      subtext = t(askOption.key, language);
      correctAnswer = askOption.answer;
    } else {
      // nativeToDutch_write
      word = selectWord('nativeToDutch_write', quizMode);
      questionText = word[language];
      subtext = t('writeTheDutch', language);
      correctAnswer = word.nl;
    }

    setQuiz({
      wordNl: word.nl,
      wordType: word.type,
      questionText,
      subtext,
      correctAnswer,
      perfectum: 'perfectum' in word ? word.perfectum : undefined,
      imperfectum: 'imperfectum' in word ? word.imperfectum : undefined,
    });
    setInputValue('');
    setShowResult(false);
    setIsCorrect(false);
    setSkipped(false);

    if (canPinInQuizType(quizType)) {
      setPinned(isPinned(quizType, word.nl));
    }

    // Focus input after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [quizType, quizMode, language]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  // Check answer on each keystroke
  useEffect(() => {
    if (!quiz || showResult) return;

    if (compareIgnoringAccents(inputValue, quiz.correctAnswer)) {
      // Correct answer!
      setIsCorrect(true);
      setShowResult(true);

      const skill = getSkillForQuizType(quizType);
      updateWordProgress(quiz.wordNl, skill, true);
      onAnswer?.();

      // Auto-advance after delay
      setTimeout(() => {
        loadNewQuestion();
      }, 1500);
    }
  }, [inputValue, quiz, showResult, quizType, loadNewQuestion, onAnswer]);

  const handleSkip = () => {
    if (!quiz || showResult) return;

    setSkipped(true);
    setIsCorrect(false);
    setShowResult(true);

    const skill = getSkillForQuizType(quizType);
    updateWordProgress(quiz.wordNl, skill, false);
    onAnswer?.();

    // Auto-advance after delay
    setTimeout(() => {
      loadNewQuestion();
    }, 2000);
  };

  const handlePinToggle = () => {
    if (!quiz || !canPin) return;
    const newPinned = togglePin(quizType, quiz.wordNl);
    setPinned(newPinned);
  };

  if (!quiz) {
    return <div class="flex flex-1 items-center justify-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  const skill = getSkillForQuizType(quizType);
  const progress = getSkillProgress(quiz.wordNl, skill);

  const inputStateClass = !showResult
    ? 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-light)]'
    : isCorrect
      ? 'border-[var(--color-success)] bg-[var(--color-success-light)]'
      : 'border-[var(--color-error)] bg-[var(--color-error-light)]';

  return (
    <div class="flex-1 flex flex-col gap-[var(--spacing-lg)] py-[var(--spacing-md)] fade-in">
      <QuizCard
        wordType={t(`type_${quiz.wordType}`, language)}
        questionText={quiz.questionText}
        subtext={quiz.subtext}
        pinned={pinned}
        canPin={canPin}
        hasHelp={!!help?.content}
        onPinToggle={handlePinToggle}
        onHelpOpen={() => setShowHelp(true)}
      >
        <input
          ref={inputRef}
          type="text"
          class={`w-full px-[var(--spacing-lg)] py-[var(--spacing-md)] text-[length:var(--text-lg)] border-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-center outline-none transition-all duration-[var(--transition-fast)] ${inputStateClass}`}
          value={inputValue}
          onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
          disabled={showResult}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {!showResult && (
          <Button variant="soft" color="default" onClick={handleSkip} class="self-center">
            {t('skip', language)}
          </Button>
        )}
      </QuizCard>

      {showResult && (
        <ResultBanner
          isCorrect={isCorrect}
          text={isCorrect
            ? t('correct', language)
            : t('correctAnswer', language, { answer: quiz.correctAnswer })}
          progress={progress}
        />
      )}

      {showHelp && help?.content && (
        <HelpModal title={help.title} content={help.content} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { QuizType, QuizMode, Language } from '../types';
import { useLanguage } from '../hooks';
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
import { Button, QuizCard, ResultBanner } from './commons';
import { locales } from '../locales';

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

export function InputQuizScreen({ quizType, quizMode = 'normal', onAnswer }: InputQuizScreenProps) {
  const { language, t, merge } = useLanguage();
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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

    const loc = locales[language];

    if (quizType === 'verbForms') {
      word = selectWord('verbForms', quizMode);

      const perfectum = 'perfectum' in word ? word.perfectum : '';
      const imperfectum = 'imperfectum' in word ? word.imperfectum : '';
      const infinitief = word.nl;

      const forms = [
        {
          show: infinitief, label: 'infinitief', askOptions: [
            { answer: perfectum, subtext: loc.quiz.write.promptPerfectum },
            { answer: imperfectum, subtext: loc.quiz.write.promptImperfectum },
          ]
        },
        {
          show: perfectum, label: 'perfectum', askOptions: [
            { answer: infinitief, subtext: loc.quiz.write.promptInfinitief },
            { answer: imperfectum, subtext: loc.quiz.write.promptImperfectum },
          ]
        },
        {
          show: imperfectum, label: 'imperfectum', askOptions: [
            { answer: infinitief, subtext: loc.quiz.write.promptInfinitief },
            { answer: perfectum, subtext: loc.quiz.write.promptPerfectum },
          ]
        },
      ].filter(f => f.show);

      const chosen = forms[Math.floor(Math.random() * forms.length)];
      const validOptions = chosen.askOptions.filter(opt => opt.answer);
      const askOption = validOptions[Math.floor(Math.random() * validOptions.length)];

      questionText = chosen.show;
      subtext = askOption.subtext;
      correctAnswer = askOption.answer;
    } else {
      word = selectWord('nativeToDutch_write', quizMode);
      questionText = word[language];
      subtext = loc.quiz.write.promptDutch;
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
    if (canPinInQuizType(quizType)) {
      setPinned(isPinned(quizType, word.nl));
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [quizType, quizMode, language]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  useEffect(() => {
    if (!quiz || showResult) return;

    if (compareIgnoringAccents(inputValue, quiz.correctAnswer)) {
      setIsCorrect(true);
      setShowResult(true);

      const skill = getSkillForQuizType(quizType);
      updateWordProgress(quiz.wordNl, skill, true);
      onAnswer?.();

      setTimeout(() => {
        loadNewQuestion();
      }, 1500);
    }
  }, [inputValue, quiz, showResult, quizType, loadNewQuestion, onAnswer]);

  const handleSkip = () => {
    if (!quiz || showResult) return;

    setIsCorrect(false);
    setShowResult(true);

    const skill = getSkillForQuizType(quizType);
    updateWordProgress(quiz.wordNl, skill, false);
    onAnswer?.();

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
    return <div class="flex flex-1 items-center justify-center text-text-secondary">Loading...</div>;
  }

  const skill = getSkillForQuizType(quizType);
  const progress = getSkillProgress(quiz.wordNl, skill);

  const wordTypeLabel: Record<string, string> = {
    noun: t.wordType.noun, verb: t.wordType.verb, adj: t.wordType.adj,
    adv: t.wordType.adv, prep: t.wordType.prep, conj: t.wordType.conj,
    phrase: t.wordType.phrase, num: t.wordType.num, pron: t.wordType.pron,
  };

  const inputStateClass = !showResult
    ? 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]'
    : isCorrect
      ? 'border-success bg-success-light'
      : 'border-error bg-error-light';

  return (
    <div class="flex-1 flex flex-col gap-6 py-4 fade-in">
      <QuizCard
        wordType={wordTypeLabel[quiz.wordType] ?? quiz.wordType}
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
          class={`w-full px-6 py-4 text-lg border-2 rounded-lg bg-(--color-surface) text-text-primary text-center outline-none transition-all duration-(--transition-fast) ${inputStateClass}`}
          value={inputValue}
          onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
          disabled={showResult}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellcheck={false}
        />
        {!showResult && (
          <Button variant="soft" color="default" onClick={handleSkip} class="self-center">
            {t.common.skip}
          </Button>
        )}
      </QuizCard>

      {showResult && (
        <ResultBanner
          isCorrect={isCorrect}
          text={isCorrect
            ? t.quiz.correct
            : merge(t.quiz.correctAnswer, { answer: quiz.correctAnswer })}
          progress={progress}
        />
      )}

      {showHelp && help?.content && (
        <HelpModal title={help.title} content={help.content} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

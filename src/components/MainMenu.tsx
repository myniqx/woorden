import { Target, BookOpen, FileText } from 'lucide-preact';
import type { QuizType, Language } from '../types';
import { t } from '../data/translations';
import './MainMenu.css';

interface MainMenuProps {
  onStartQuiz: (quizType: QuizType) => void;
  language: Language;
}

interface QuizTypeCard {
  type: QuizType;
  icon: typeof Target;
  color: string;
}

const quizTypes: QuizTypeCard[] = [
  { type: 'nativeToDutch', icon: Target, color: '#ff6b35' },
  { type: 'dutchToNative', icon: BookOpen, color: '#4caf50' },
  { type: 'article', icon: FileText, color: '#2196f3' },
];

export function MainMenu({ onStartQuiz, language }: MainMenuProps) {
  const tr = (key: string) => t(key, language);

  return (
    <div class="main-menu fade-in">
      <h1 class="menu-title">{tr('selectQuizType')}</h1>

      <div class="quiz-type-grid">
        {quizTypes.map(({ type, icon: Icon, color }) => (
          <button
            key={type}
            class="quiz-type-card"
            onClick={() => onStartQuiz(type)}
            style={{ '--card-color': color } as any}
          >
            <div class="card-icon">
              <Icon size={32} />
            </div>
            <div class="card-content">
              <h2 class="card-title">{tr(`quiz_${type}`)}</h2>
              <p class="card-description">{tr(`quiz_${type}_desc`)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

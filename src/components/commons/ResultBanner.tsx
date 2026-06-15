import { Eye, Check, X, Flame } from 'lucide-preact';
import type { SkillProgress } from '../../types';

interface ResultBannerProps {
  isCorrect: boolean;
  text: string;
  progress: SkillProgress;
}

export function ResultBanner({ isCorrect, text, progress }: ResultBannerProps) {
  const colorClass = isCorrect
    ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
    : 'bg-[var(--color-error-light)] text-[var(--color-error)]';

  return (
    <div class={`px-6 py-4 rounded-[var(--radius-lg)] text-center font-medium scale-in ${colorClass}`}>
      <div class="mb-2">{text}</div>
      <div class="flex justify-center gap-4 text-[length:var(--text-sm)] opacity-90">
        <span class="flex items-center gap-1"><Eye size={14} /> {progress.seen}</span>
        <span class={`flex items-center gap-1 ${isCorrect ? 'font-semibold' : ''}`}><Check size={14} /> {progress.correct}</span>
        <span class={`flex items-center gap-1 ${!isCorrect ? 'font-semibold' : ''}`}><X size={14} /> {progress.wrong}</span>
        <span class="flex items-center gap-1"><Flame size={14} /> {progress.streak}</span>
      </div>
    </div>
  );
}

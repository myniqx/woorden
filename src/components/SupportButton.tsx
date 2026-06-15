import { Coffee } from 'lucide-preact';
import type { Language } from '../types';
import { useLanguage } from '../hooks';

const texts: Record<Language, { title: string; subtitle: string }> = {
  tr: { title: 'Projeyi Destekle', subtitle: 'Bir kahve ısmarla' },
  en: { title: 'Support the Project', subtitle: 'Buy me a coffee' },
  ar: { title: 'ادعم المشروع', subtitle: 'اشترِ لي قهوة' },
  fr: { title: 'Soutenir le projet', subtitle: 'Offrez-moi un café' },
};

export function SupportButton() {
  const { language } = useLanguage();
  const text = texts[language] || texts.en;

  return (
    <button
      class="flex items-center gap-4 px-6 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-left text-[#6F4E37] transition-all duration-[var(--transition-normal)] hover:border-[#6F4E37] hover:bg-[rgba(111,78,55,0.1)]"
      onClick={() => window.open('https://ko-fi.com/myniqx', '_blank', 'noopener,noreferrer')}
    >
      <Coffee size={20} />
      <div class="flex flex-col gap-0.5">
        <span class="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)]">{text.title}</span>
        <span class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">{text.subtitle}</span>
      </div>
    </button>
  );
}

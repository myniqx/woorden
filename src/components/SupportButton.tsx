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
      class="flex items-center gap-4 px-6 py-4 bg-surface border border-border rounded-lg cursor-pointer text-left text-[#6F4E37] transition-all duration-(--transition-normal) hover:border-[#6F4E37] hover:bg-[rgba(111,78,55,0.1)]"
      onClick={() => window.open('https://ko-fi.com/myniqx', '_blank', 'noopener,noreferrer')}
    >
      <Coffee size={20} />
      <div class="flex flex-col gap-0.5">
        <span class="text-base font-semibold text-text-primary">{text.title}</span>
        <span class="text-sm text-text-secondary">{text.subtitle}</span>
      </div>
    </button>
  );
}

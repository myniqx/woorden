import { Coffee } from 'lucide-preact';
import type { Language } from '../types';
import { useLanguage } from '../hooks';
import './SupportButton.css';

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
    <button class="support-button" onClick={() => window.open('https://ko-fi.com/myniqx', '_blank', 'noopener,noreferrer')}>
      <Coffee size={20} />
      <div class="support-button-content">
        <span class="support-button-title">{text.title}</span>
        <span class="support-button-subtitle">{text.subtitle}</span>
      </div>
    </button>
  );
}

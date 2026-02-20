import { Coffee } from 'lucide-preact';
import type { Language } from '../types';
import './SupportButton.css';

interface SupportButtonProps {
  language: Language;
}

const texts: Record<Language, { title: string; subtitle: string }> = {
  tr: {
    title: 'Projeyi Destekle',
    subtitle: 'Bir kahve ısmarla',
  },
  en: {
    title: 'Support the Project',
    subtitle: 'Buy me a coffee',
  },
  ar: {
    title: 'ادعم المشروع',
    subtitle: 'اشترِ لي قهوة',
  },
  fr: {
    title: 'Soutenir le projet',
    subtitle: 'Offrez-moi un café',
  },
};

export function SupportButton({ language }: SupportButtonProps) {
  const t = texts[language] || texts.en;

  const handleClick = () => {
    window.open('https://ko-fi.com/myniqx', '_blank', 'noopener,noreferrer');
  };

  return (
    <button class="support-button" onClick={handleClick}>
      <Coffee size={20} />
      <div class="support-button-content">
        <span class="support-button-title">{t.title}</span>
        <span class="support-button-subtitle">{t.subtitle}</span>
      </div>
    </button>
  );
}

import { useState } from 'preact/hooks';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-preact';
import type { Language } from '../types';
import { t } from '../data/translations';
import { useLanguage } from '../hooks';
import {
  getAvailableLevels,
  getChunkCount,
  getChunkWordCount,
  getLevelWordCount,
  getSelectedWordCount,
  refreshWords,
} from '../services/words';
import {
  isChunkEnabled,
  setChunkEnabled,
  areAllChunksEnabled,
  areNoChunksEnabled,
} from '../services/storage';
import { HelpModal } from './HelpModal';
import { Button, Modal } from './commons';

const helpTexts: Record<Language, { title: string; content: string }> = {
  tr: {
    title: 'Kelime Havuzu Nedir?',
    content: 'Kelime havuzu, testlerde karşınıza çıkacak kelimeleri belirlemenizi sağlar. Seviyeler (A1, A2 vb.) içinde küçük paketler halinde kelimeler bulunur. Başlangıçta küçük bir kelime grubuna odaklanıp, onları öğrendikten sonra yeni paketler ekleyerek ilerlemenizi öneririz.',
  },
  en: {
    title: 'What is Word Pool?',
    content: 'The word pool lets you choose which words appear in quizzes. Levels (A1, A2, etc.) contain words in smaller packs. We recommend starting with a small group of words, and adding new packs as you learn them.',
  },
  ar: {
    title: 'ما هي مجموعة الكلمات؟',
    content: 'تتيح لك مجموعة الكلمات اختيار الكلمات التي ستظهر في الاختبارات. تحتوي المستويات (A1، A2، إلخ) على كلمات في حزم صغيرة. نوصي بالبدء بمجموعة صغيرة من الكلمات، وإضافة حزم جديدة كلما تعلمتها.',
  },
  fr: {
    title: "Qu'est-ce que le groupe de mots?",
    content: "Le groupe de mots vous permet de choisir les mots qui apparaissent dans les quiz. Les niveaux (A1, A2, etc.) contiennent des mots en petits paquets. Nous vous recommandons de commencer avec un petit groupe de mots, puis d'ajouter de nouveaux paquets au fur et à mesure.",
  },
};

interface WordPoolModalProps {
  onClose: () => void;
}

export function WordPoolModal({ onClose }: WordPoolModalProps) {
  const { language } = useLanguage();
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [, forceUpdate] = useState(0);

  const levels = getAvailableLevels();
  const help = helpTexts[language] || helpTexts.en;

  const toggleExpand = (level: string) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const handleChunkToggle = (level: string, chunkIndex: number) => {
    setChunkEnabled(level, chunkIndex, !isChunkEnabled(level, chunkIndex));
    refreshWords();
    forceUpdate(n => n + 1);
  };

  const handleLevelToggle = (level: string) => {
    const chunkCount = getChunkCount(level);
    const allEnabled = areAllChunksEnabled(level, chunkCount);

    // If all enabled, disable all. Otherwise enable all.
    for (let i = 0; i < chunkCount; i++) {
      setChunkEnabled(level, i, !allEnabled);
    }
    refreshWords();
    forceUpdate(n => n + 1);
  };

  const getLevelCheckState = (level: string): 'all' | 'none' | 'partial' => {
    const chunkCount = getChunkCount(level);
    if (areAllChunksEnabled(level, chunkCount)) return 'all';
    if (areNoChunksEnabled(level, chunkCount)) return 'none';
    return 'partial';
  };

  const totalSelected = getSelectedWordCount();

  const iconBtnClass = 'flex items-center justify-center p-[var(--spacing-xs)] bg-none border-none cursor-pointer text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] transition-all duration-[var(--transition-fast)]';

  return (
    <>
      <Modal onClose={onClose} maxWidth="md">
        <Modal.Header
          title={t('wordPool', language)}
          onClose={onClose}
        >
          <Button variant="ghost" icon={HelpCircle} size="icon" onClick={() => setShowHelp(true)} aria-label="Help" />
        </Modal.Header>

        <div class="block text-[length:var(--text-sm)] text-[var(--color-text-secondary)] px-[var(--spacing-lg)] py-[var(--spacing-sm)] border-b border-[var(--color-border)]">
          {t('wordPoolDesc', language, { count: totalSelected })}
        </div>

        <Modal.Body>
          <div class="flex flex-col gap-[var(--spacing-sm)]">
            {levels.map(level => {
              const chunkCount = getChunkCount(level);
              const levelWordCount = getLevelWordCount(level);
              const isExpanded = expandedLevels[level];
              const checkState = getLevelCheckState(level);

              return (
                <div key={level}>
                  <div class="flex items-center gap-[var(--spacing-xs)] p-[var(--spacing-sm)] bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)]">
                    <button
                      class={`${iconBtnClass} hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]`}
                      onClick={() => toggleExpand(level)}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <label class="flex items-center gap-[var(--spacing-sm)] flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="w-[18px] h-[18px] cursor-pointer accent-[var(--color-primary)]"
                        checked={checkState === 'all'}
                        ref={(el) => { if (el) el.indeterminate = checkState === 'partial'; }}
                        onChange={() => handleLevelToggle(level)}
                      />
                      <span class="font-semibold text-[length:var(--text-base)] text-[var(--color-text-primary)]">{level}</span>
                      <span class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] ml-auto">
                        {t('wordsSelected', language, { count: levelWordCount })}
                      </span>
                    </label>
                  </div>

                  {isExpanded && (
                    <div class="ml-[calc(var(--spacing-lg)+var(--spacing-md))] mt-[var(--spacing-xs)] flex flex-col gap-[var(--spacing-xs)]">
                      {Array.from({ length: chunkCount }, (_, i) => {
                        const wordCount = getChunkWordCount(level, i);
                        const enabled = isChunkEnabled(level, i);

                        return (
                          <label key={i} class="flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)] cursor-pointer rounded-[var(--radius-sm)] transition-all duration-[var(--transition-fast)] hover:bg-[var(--color-surface-elevated)]">
                            <input
                              type="checkbox"
                              class="w-[16px] h-[16px] cursor-pointer accent-[var(--color-primary)]"
                              checked={enabled}
                              onChange={() => handleChunkToggle(level, i)}
                            />
                            <span class="text-[length:var(--text-sm)] text-[var(--color-text-primary)]">
                              {t('pack', language, { num: i + 1 })}
                            </span>
                            <span class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] ml-auto">
                              {t('wordsSelected', language, { count: wordCount })}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Modal.Body>
      </Modal>

      {showHelp && (
        <HelpModal
          title={help.title}
          content={help.content}
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  );
}

import { useState } from 'preact/hooks';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-preact';
import { useLanguage } from '../../hooks';
import {
  getAvailableLevels,
  getChunkCount,
  getChunkWordCount,
  getLevelWordCount,
  getSelectedWordCount,
  refreshWords,
} from '../../services/words';
import {
  isChunkEnabled,
  setChunkEnabled,
  areAllChunksEnabled,
  areNoChunksEnabled,
} from '../../services/storage';
import { HelpModal } from '../HelpModal';
import { Button, Modal } from '../commons';
import type { Language } from '../../types';

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
  const { t, merge } = useLanguage();
  const { language } = useLanguage();
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [, forceUpdate] = useState(0);

  const levels = getAvailableLevels();

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

  const iconBtnClass = 'flex items-center justify-center p-1 bg-none border-none cursor-pointer text-text-secondary rounded-sm transition-all duration-(--transition-fast)';

  return (
    <>
      <Modal onClose={onClose} maxWidth="md">
        <Modal.Header
          title={t.wordPool.title}
          onClose={onClose}
        >
          <Button variant="ghost" icon={HelpCircle} size="icon" onClick={() => setShowHelp(true)} aria-label="Help" />
        </Modal.Header>

        <div class="block text-sm text-text-secondary px-6 py-2 border-b border-border">
          {merge(t.wordPool.desc, { count: totalSelected })}
        </div>

        <Modal.Body>
          <div class="flex flex-col gap-2">
            {levels.map(level => {
              const chunkCount = getChunkCount(level);
              const levelWordCount = getLevelWordCount(level);
              const isExpanded = expandedLevels[level];
              const checkState = getLevelCheckState(level);

              return (
                <div key={level}>
                  <div class="flex items-center gap-1 p-2 bg-surface-elevated rounded-md">
                    <button
                      class={`${iconBtnClass} hover:bg-border hover:text-text-primary`}
                      onClick={() => toggleExpand(level)}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <label class="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        class="w-[18px] h-[18px] cursor-pointer accent-primary"
                        checked={checkState === 'all'}
                        ref={(el) => { if (el) el.indeterminate = checkState === 'partial'; }}
                        onChange={() => handleLevelToggle(level)}
                      />
                      <span class="font-semibold text-base text-text-primary">{level}</span>
                      <span class="text-sm text-text-secondary ml-auto">
                        {merge(t.wordPool.wordsSelected, { count: levelWordCount })}
                      </span>
                    </label>
                  </div>

                  {isExpanded && (
                    <div class="ml-[calc(var6+var4)] mt-1 flex flex-col gap-1">
                      {Array.from({ length: chunkCount }, (_, i) => {
                        const wordCount = getChunkWordCount(level, i);
                        const enabled = isChunkEnabled(level, i);

                        return (
                          <label key={i} class="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-sm transition-all duration-(--transition-fast) hover:bg-surface-elevated">
                            <input
                              type="checkbox"
                              class="w-[16px] h-[16px] cursor-pointer accent-primary"
                              checked={enabled}
                              onChange={() => handleChunkToggle(level, i)}
                            />
                            <span class="text-sm text-text-primary">
                              {merge(t.wordPool.pack, { num: i + 1 })}
                            </span>
                            <span class="text-sm text-text-secondary ml-auto">
                              {merge(t.wordPool.wordsSelected, { count: wordCount })}
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
          title={(helpTexts[language] || helpTexts.en).title}
          content={(helpTexts[language] || helpTexts.en).content}
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  );
}

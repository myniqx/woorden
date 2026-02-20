import { useState } from 'preact/hooks';
import { ChevronDown, ChevronRight, X, HelpCircle } from 'lucide-preact';
import type { Language } from '../types';
import { t } from '../data/translations';
import {
  getAvailableLevels,
  getChunkCount,
  getChunkWordCount,
  getLevelWordCount,
  getSelectedWordCount,
  refreshWords,
} from '../services/words';
import {
  isLevelEnabled,
  isChunkEnabled,
  setChunkEnabled,
  areAllChunksEnabled,
  areNoChunksEnabled,
} from '../services/storage';
import { HelpModal } from './HelpModal';
import './WordPoolModal.css';

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
  language: Language;
  onClose: () => void;
}

export function WordPoolModal({ language, onClose }: WordPoolModalProps) {
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

  return (
    <div class="word-pool-overlay" onClick={onClose}>
      <div class="word-pool-modal" onClick={(e) => e.stopPropagation()}>
        <div class="word-pool-header">
          <div class="word-pool-title">
            <h2>{t('wordPool', language)}</h2>
            <span class="word-pool-count">
              {t('wordPoolDesc', language, { count: totalSelected })}
            </span>
          </div>
          <div class="word-pool-header-actions">
            <button class="word-pool-help" onClick={() => setShowHelp(true)}>
              <HelpCircle size={20} />
            </button>
            <button class="word-pool-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div class="word-pool-content">
          {levels.map(level => {
            const chunkCount = getChunkCount(level);
            const levelWordCount = getLevelWordCount(level);
            const isExpanded = expandedLevels[level];
            const checkState = getLevelCheckState(level);

            return (
              <div key={level} class="word-pool-level">
                <div class="word-pool-level-header">
                  <button
                    class="word-pool-expand-btn"
                    onClick={() => toggleExpand(level)}
                  >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  <label class="word-pool-level-label">
                    <input
                      type="checkbox"
                      checked={checkState === 'all'}
                      ref={(el) => {
                        if (el) el.indeterminate = checkState === 'partial';
                      }}
                      onChange={() => handleLevelToggle(level)}
                    />
                    <span class="word-pool-level-name">{level}</span>
                    <span class="word-pool-level-count">
                      {t('wordsSelected', language, { count: levelWordCount })}
                    </span>
                  </label>
                </div>

                {isExpanded && (
                  <div class="word-pool-chunks">
                    {Array.from({ length: chunkCount }, (_, i) => {
                      const wordCount = getChunkWordCount(level, i);
                      const enabled = isChunkEnabled(level, i);

                      return (
                        <label key={i} class="word-pool-chunk">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => handleChunkToggle(level, i)}
                          />
                          <span class="word-pool-chunk-name">
                            {t('pack', language, { num: i + 1 })}
                          </span>
                          <span class="word-pool-chunk-count">
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
      </div>

      {showHelp && (
        <HelpModal
          title={help.title}
          content={help.content}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}

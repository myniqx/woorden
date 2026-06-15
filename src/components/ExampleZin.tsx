import { useMemo } from 'preact/hooks';
import type { WordEntry } from '../types';
import { getZin } from '../services/zinnen';

interface Props {
  word: WordEntry;
}

export function ExampleZin({ word }: Props) {
  const tokens = useMemo(() => {
    if (!word.zinnen?.length) return null;
    return getZin(word.zinnen, word.nl);
  }, [word.nl, word.zinnen]);

  if (!tokens) return null;

  return (
    <p class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] italic mt-[var(--spacing-xs)] mb-0 leading-relaxed">
      {tokens.map((token, i) => (
        <span key={i}>
          {i > 0 ? ' ' : ''}
          {token.highlighted
            ? <mark class="bg-transparent text-[var(--color-primary)] font-semibold not-italic">{token.text}</mark>
            : token.text}
        </span>
      ))}
    </p>
  );
}

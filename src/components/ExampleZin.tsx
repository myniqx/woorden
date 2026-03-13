import { useMemo } from 'preact/hooks';
import type { WordEntry } from '../types';
import { getZin } from '../services/zinnen';
import './ExampleZin.css';

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
    <p class="example-zin">
      {tokens.map((token, i) => (
        <span key={i}>
          {i > 0 ? ' ' : ''}
          {token.highlighted
            ? <mark class="example-zin__highlight">{token.text}</mark>
            : token.text}
        </span>
      ))}
    </p>
  );
}

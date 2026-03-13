import zin001 from '../data/zin-001.json';
import zin002 from '../data/zin-002.json';
import zin003 from '../data/zin-003.json';

const allZins: Record<string, string> = {
  ...zin001,
  ...zin002,
  ...zin003,
};

export interface ZinToken {
  text: string;
  highlighted: boolean;
}

function parseMarked(marked: string, targetNl: string): ZinToken[] {
  const targetLower = targetNl.toLowerCase();

  // Collect group numbers that belong to targetNl
  const highlightedGroups = new Set<number>();
  const tokens = marked.trim().split(/\s+/);

  // First pass: find which group numbers map to targetNl
  for (const token of tokens) {
    const m = token.match(/^(\d+)\|([^@]+)(?:@(.+))?$/);
    if (!m) continue;
    const num = parseInt(m[1]);
    const display = m[2].replace(/[.,?!;:]+$/, '');
    const explicitBase = m[3]?.replace(/_/g, ' ').replace(/[.,?!;:]+$/, '');
    const base = (explicitBase ?? display).toLowerCase();
    if (base === targetLower) highlightedGroups.add(num);
  }

  // Second pass: build token list
  const result: ZinToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const m = token.match(/^(\d+)\|([^@]+)(?:@.+)?$/);
    if (m) {
      const num = parseInt(m[1]);
      const display = m[2]; // keep trailing punctuation for display
      result.push({ text: display, highlighted: highlightedGroups.has(num) });
    } else {
      result.push({ text: token, highlighted: false });
    }
  }
  return result;
}

export function getZin(zinIds: string[], targetNl: string): ZinToken[] | null {
  if (!zinIds.length) return null;

  const id = zinIds[Math.floor(Math.random() * zinIds.length)];
  const marked = allZins[id];
  if (!marked) return null;

  return parseMarked(marked, targetNl);
}

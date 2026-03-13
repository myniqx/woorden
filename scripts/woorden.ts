#!/usr/bin/env node
/**
 * woorden — CLI tool for managing Dutch word packs
 *
 * Commands:
 *   find-duplicate <PACK> [--page N]   Find words in PACK that also exist in higher packs
 *   remove <PACK> <word>               Remove a specific word from PACK (asks confirmation)
 *   add-zin [--limit N]                Add an example sentence interactively
 *   remove-zin <id>                    Remove a sentence by ID (asks confirmation)
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/data');
const PAGE_SIZE = 5;
const DEFAULT_ZIN_LIMIT = 5;
const MAX_ZINNEN_PER_FILE = 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordEntry {
  nl: string;
  type: string;
  article?: string;
  diminutive?: string;
  perfectum?: string;
  imperfectum?: string;
  en?: string;
  tr?: string;
  ar?: string;
  fr?: string;
  zinnen?: string[];
}

interface WordInPack {
  word: WordEntry;
  pack: string;
  file: string;
}

interface Duplicate {
  key: string;
  entries: WordInPack[];
}

// ZinFile: { "ab3k9x2m": "ik 1|denk 2|over hen 1|aan", ... }
type ZinFile = Record<string, string>;

// ─── Pack helpers ─────────────────────────────────────────────────────────────

function filenameToPack(filename: string): string {
  const m = filename.match(/^(a\d+p?)-\d+\.json$/);
  if (!m) return '';
  return m[1] === 'a2p' ? 'A2+' : m[1].toUpperCase();
}

function normalizePack(arg: string): string {
  const lower = arg.toLowerCase().replace('+', 'p');
  if (lower === 'a2p') return 'A2+';
  return lower.replace('a', 'A');
}

// ─── Word data ────────────────────────────────────────────────────────────────

function loadAllWords(): Map<string, WordInPack[]> {
  const packMap = new Map<string, WordInPack[]>();
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort();

  for (const file of files) {
    const pack = filenameToPack(file);
    if (!pack) continue;
    const words: WordEntry[] = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
    if (!packMap.has(pack)) packMap.set(pack, []);
    for (const word of words) packMap.get(pack)!.push({ word, pack, file });
  }
  return packMap;
}

function findWordEntry(nl: string, allWords: Map<string, WordInPack[]>, limit?: number): WordInPack | null {
  const all = findAllWordEntries(nl, allWords);
  if (all.length === 0) return null;
  if (limit !== undefined) {
    const underLimit = all.find(wp => (wp.word.zinnen?.length ?? 0) < limit);
    if (underLimit) return underLimit;
  }
  return all[0];
}

function findAllWordEntries(nl: string, allWords: Map<string, WordInPack[]>): WordInPack[] {
  const nlLower = nl.toLowerCase();
  const exact: WordInPack[] = [];
  const caseInsensitive: WordInPack[] = [];

  for (const words of allWords.values()) {
    for (const found of words) {
      if (found.word.nl === nl) exact.push(found);
      else if (found.word.nl.toLowerCase() === nlLower) caseInsensitive.push(found);
    }
  }
  return exact.length > 0 ? exact : caseInsensitive;
}

// ─── Duplicate logic ──────────────────────────────────────────────────────────

function dupKey(w: WordEntry): string {
  return `${w.nl}::${w.type}`;
}

const PACK_ORDER = ['A1', 'A2', 'A2+'];

function higherPacks(targetPack: string): string[] {
  const idx = PACK_ORDER.indexOf(targetPack);
  if (idx === -1) return [];
  return PACK_ORDER.slice(idx + 1);
}

function findDuplicates(targetPack: string, allWords: Map<string, WordInPack[]>): Duplicate[] {
  const targetWords = allWords.get(targetPack)!;
  const above = new Set(higherPacks(targetPack));

  const otherIndex = new Map<string, WordInPack[]>();
  for (const [pack, words] of allWords) {
    if (!above.has(pack)) continue;
    for (const wp of words) {
      const k = dupKey(wp.word);
      if (!otherIndex.has(k)) otherIndex.set(k, []);
      otherIndex.get(k)!.push(wp);
    }
  }

  const duplicates: Duplicate[] = [];
  for (const wp of targetWords) {
    const k = dupKey(wp.word);
    const others = otherIndex.get(k);
    if (others?.length) duplicates.push({ key: k, entries: [wp, ...others] });
  }
  return duplicates;
}

// ─── Zin helpers ──────────────────────────────────────────────────────────────

function getZinFiles(): string[] {
  return readdirSync(DATA_DIR).filter(f => /^zin-\d+\.json$/.test(f)).sort();
}

function loadZinFile(file: string): ZinFile {
  try { return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8')); }
  catch { return {}; }
}

function saveZinFile(file: string, data: ZinFile): void {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function loadAllZins(): Map<string, { marked: string; file: string; line: number }> {
  const result = new Map<string, { marked: string; file: string; line: number }>();
  for (const file of getZinFiles()) {
    const data = loadZinFile(file);
    const lines = readFileSync(join(DATA_DIR, file), 'utf-8').split('\n');
    for (const [id, marked] of Object.entries(data)) {
      const line = lines.findIndex(l => l.includes(`"${id}"`)) + 1;
      result.set(id, { marked, file, line });
    }
  }
  return result;
}

/** Returns a VSCode-clickable location string: src/data/zin-001.json:12 */
function zinLocation(entry: { file: string; line: number }): string {
  return DIM(`src/data/${entry.file}:${entry.line}`);
}

function getActiveZinFile(): { file: string; data: ZinFile } {
  const files = getZinFiles();
  for (const file of [...files].reverse()) {
    const data = loadZinFile(file);
    if (Object.keys(data).length < MAX_ZINNEN_PER_FILE) return { file, data };
  }
  const num = files.length + 1;
  return { file: `zin-${String(num).padStart(3, '0')}.json`, data: {} };
}

function generateId(existingIds: Set<string>): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id: string;
  do {
    id = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingIds.has(id));
  return id;
}

/**
 * Parse "ik 1|denkt@nadenken over 1|na"  (Option B inheritance)
 * → clean: "ik denkt over na"
 * → groups: Map { 1 → { base: "nadenken", tokens: ["denkt","na"] } }
 *
 * Rules:
 *   N|token@base  — first occurrence of group N; defines the base for that group
 *   N|token       — subsequent tokens; inherit base from first occurrence
 *   Trailing punctuation (.,?!;:) is stripped from display before deriving default base,
 *   so 3|school. and 3|school, both resolve to "school" without needing @base
 */
function parseMarked(marked: string): {
  clean: string;
  groups: Map<number, { base: string; tokens: string[] }>;
} {
  const tokens = marked.trim().split(/\s+/);
  const groups = new Map<number, { base: string; tokens: string[] }>();
  const cleanTokens: string[] = [];

  for (const token of tokens) {
    const m = token.match(/^(\d+)\|([^@]+)(?:@(.+))?$/);
    if (m) {
      const num = parseInt(m[1]);
      const display = m[2];
      // Underscores in @base encode spaces: @houden_van → "houden van"
      // Also strip trailing punctuation from explicit base (same as default base)
      const explicitBase = m[3]?.replace(/_/g, ' ').replace(/[.,?!;:]+$/, '');
      // Strip trailing punctuation from display when deriving default base
      const defaultBase = display.replace(/[.,?!;:]+$/, '');
      if (!groups.has(num)) {
        groups.set(num, { base: explicitBase ?? defaultBase, tokens: [] });
      } else if (explicitBase) {
        groups.get(num)!.base = explicitBase;
      }
      groups.get(num)!.tokens.push(display);
      cleanTokens.push(display);
    } else {
      cleanTokens.push(token);
    }
  }
  return { clean: cleanTokens.join(' '), groups };
}

/** Render with one word group bolded, strip @base and notation from rest */
function renderHighlight(marked: string, activeNum: number): string {
  return marked.trim().split(/\s+/).map(token => {
    const m = token.match(/^(\d+)\|([^@]+)(?:@.+)?$/);
    if (!m) return token;
    return parseInt(m[1]) === activeNum ? BOLD(m[2]) : m[2];
  }).join(' ');
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const BOLD = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const GREEN = (s: string) => `\x1b[32m${s}\x1b[0m`;
const AMBER = (s: string) => `\x1b[33m${s}\x1b[0m`;
const RED = (s: string) => `\x1b[31m${s}\x1b[0m`;

function translationMatch(a: WordEntry, b: WordEntry): 'identical' | 'similar' | 'different' {
  const langs = ['en', 'tr', 'ar', 'fr'] as const;
  let matches = 0, total = 0;
  for (const lang of langs) {
    if (a[lang] !== undefined || b[lang] !== undefined) {
      total++;
      if (a[lang] === b[lang]) matches++;
    }
  }
  if (total === 0) return 'identical';
  if (matches === total) return 'identical';
  if (matches > 0) return 'similar';
  return 'different';
}

function entryLines(w: WordEntry): string[] {
  const lines: string[] = [];
  if (w.article) {
    lines.push(`article: ${w.article}${w.diminutive ? `  diminutive: ${w.diminutive}` : ''}`);
  }
  if (w.perfectum || w.imperfectum) {
    const parts: string[] = [];
    if (w.perfectum) parts.push(`perfectum: ${w.perfectum}`);
    if (w.imperfectum) parts.push(`imperfectum: ${w.imperfectum}`);
    lines.push(parts.join('   '));
  }
  const langs: Array<keyof WordEntry> = ['en', 'tr', 'fr', 'ar'];
  const transParts = langs.filter(l => w[l]).map(l => `${l}: ${w[l]}`);
  if (transParts.length) lines.push(transParts.join('   '));
  return lines;
}

function printDuplicate(dup: Duplicate, index: number, total: number) {
  const [target, ...others] = dup.entries;
  const w = target.word;
  console.log(`\n  [${index}/${total}]  ${BOLD(w.nl)}   type: ${w.type}`);
  console.log('  ' + '─'.repeat(60));

  for (let i = 0; i < dup.entries.length; i++) {
    const { word, pack, file } = dup.entries[i];
    const corner = i === 0 ? '┌─' : i < dup.entries.length - 1 ? '├─' : '└─';
    console.log(`  ${corner} ${BOLD(pack.padEnd(4))}  ${DIM(file)}`);
    for (const line of entryLines(word)) console.log(`       ${line}`);
  }

  if (others.length === 1) {
    const match = translationMatch(target.word, others[0].word);
    const label =
      match === 'identical' ? GREEN('✓ IDENTICAL — safe to remove from either pack') :
        match === 'similar' ? AMBER('~ SIMILAR   — translations differ slightly, review before removing') :
          RED('✗ DIFFERENT — same nl+type but different translations, check carefully');
    console.log(`\n       ${label}`);
  }
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdFindDuplicate(args: string[]) {
  const packArg = args[0];
  if (!packArg || packArg.startsWith('--')) {
    console.error('Usage: woorden find-duplicate <PACK> [--page N]');
    process.exit(1);
  }

  const targetPack = normalizePack(packArg);
  const pageIdx = args.indexOf('--page');
  const page = pageIdx >= 0 ? (parseInt(args[pageIdx + 1]) || 1) : 1;
  const allWords = loadAllWords();

  if (!allWords.has(targetPack)) {
    console.error(`Pack "${targetPack}" not found. Available: ${[...allWords.keys()].join(', ')}`);
    process.exit(1);
  }

  console.log('');
  console.log('  Packs loaded:');
  for (const [pack, words] of allWords) {
    const arrow = pack === targetPack ? `  ←  ${BOLD('target')}` : '';
    console.log(`    ${pack.padEnd(5)}  ${words.length} words${arrow}`);
  }

  const duplicates = findDuplicates(targetPack, allWords);

  if (duplicates.length === 0) {
    console.log(`\n  ${GREEN('✓')} No duplicates found in ${targetPack}.\n`);
    return;
  }

  const totalPages = Math.ceil(duplicates.length / PAGE_SIZE);
  const clampedPage = Math.max(1, Math.min(page, totalPages));
  const start = (clampedPage - 1) * PAGE_SIZE;
  const slice = duplicates.slice(start, start + PAGE_SIZE);

  console.log(`\n  Found ${BOLD(String(duplicates.length))} duplicate(s) in ${BOLD(targetPack)}` +
    (totalPages > 1 ? `  (page ${clampedPage}/${totalPages})` : '') + '\n');

  for (let i = 0; i < slice.length; i++) printDuplicate(slice[i], start + i + 1, duplicates.length);

  if (clampedPage < totalPages) {
    console.log(`\n  Next page:  woorden find-duplicate ${packArg} --page ${clampedPage + 1}`);
  }
  console.log(`\n  To remove a word:  woorden remove ${packArg} <word>\n`);
}

async function cmdRemove(args: string[]) {
  const packArg = args[0];
  const nlWord = args[1];

  if (!packArg || packArg.startsWith('--') || !nlWord) {
    console.error('Usage: woorden remove <PACK> <word>');
    process.exit(1);
  }

  const targetPack = normalizePack(packArg);
  const allWords = loadAllWords();

  if (!allWords.has(targetPack)) {
    console.error(`Pack "${targetPack}" not found. Available: ${[...allWords.keys()].join(', ')}`);
    process.exit(1);
  }

  const matches = allWords.get(targetPack)!.filter(wp => wp.word.nl === nlWord);
  if (matches.length === 0) {
    console.log(`\n  "${nlWord}" not found in ${targetPack}.\n`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));
  let toDelete: WordInPack;

  if (matches.length === 1) {
    const wp = matches[0];
    console.log(`\n  Found in ${BOLD(targetPack)}  ${DIM(wp.file)}`);
    for (const line of entryLines(wp.word)) console.log(`    ${line}`);
    const answer = await ask(`\n  Remove "${nlWord}" (${wp.word.type}) from ${BOLD(targetPack)}? [y/N]  `);
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') { console.log('  Cancelled.\n'); return; }
    toDelete = wp;
  } else {
    console.log(`\n  "${nlWord}" appears ${matches.length} times in ${BOLD(targetPack)}:\n`);
    for (let i = 0; i < matches.length; i++) {
      const { word, file } = matches[i];
      console.log(`  [${i + 1}]  type: ${BOLD(word.type)}   ${DIM(file)}`);
      for (const line of entryLines(word)) console.log(`       ${line}`);
      console.log('');
    }
    const answer = await ask(`  Which to remove? [1-${matches.length}] or [n] to cancel:  `);
    rl.close();
    const idx = parseInt(answer.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= matches.length) { console.log('  Cancelled.\n'); return; }
    toDelete = matches[idx];
  }

  const path = join(DATA_DIR, toDelete.file);
  const words: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
  const filtered = words.filter(w => dupKey(w) !== dupKey(toDelete.word));
  writeFileSync(path, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
  console.log(`\n  ${GREEN('✓')} Removed "${nlWord}" (${toDelete.word.type}) from ${DIM(toDelete.file)}\n`);
}

function cmdAddZin(args: string[]) {
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? (parseInt(args[limitIdx + 1]) || DEFAULT_ZIN_LIMIT) : DEFAULT_ZIN_LIMIT;

  const marked = args.find(a => !a.startsWith('--'));
  if (!marked) {
    console.error('Usage: woorden add-zin "<marked sentence>" [--limit N]');
    console.error('  Base form embedded with @:  "ik 1|ga@gaan naar 2|school"');
    console.error('  Separable verb example:     "hij 1|denkt@nadenken over 1|na"');
    process.exit(1);
  }

  const { clean, groups } = parseMarked(marked);
  if (groups.size === 0) {
    console.error('  No annotated words found. Use notation like: ik 1|ga@gaan naar 2|school');
    process.exit(1);
  }

  const sortedNums = [...groups.keys()].sort((a, b) => a - b);

  // Preview
  console.log(`\n  Clean:  ${clean}`);
  for (const num of sortedNums) {
    const { base } = groups.get(num)!;
    console.log(`  Word ${num} (${base}):  ${renderHighlight(marked, num)}`);
  }
  console.log('');

  // Look up words and check limits
  const allWords = loadAllWords();

  type EntryResult = { wp: WordInPack; zinCount: number; atLimit: boolean };
  type WordResult = { base: string; entries: EntryResult[] };
  const results: WordResult[] = [];

  for (const num of sortedNums) {
    const { base } = groups.get(num)!;
    const wps = findAllWordEntries(base, allWords);
    const entries: EntryResult[] = wps.map(wp => {
      const zinCount = wp.word.zinnen?.length ?? 0;
      const atLimit = zinCount >= limit;
      return { wp, zinCount, atLimit };
    });
    results.push({ base, entries });

    if (entries.length === 0) {
      console.log(`  ${RED('✗')} "${base}" not found in any pack`);
    } else {
      for (const { wp, zinCount, atLimit } of entries) {
        const limitTag = atLimit ? RED(' ← at limit') : '';
        console.log(`  ${atLimit ? AMBER('~') : GREEN('✓')} ${base.padEnd(20)} ${wp.pack}  ${DIM(wp.file)}  zinnen: ${zinCount}/${limit}${limitTag}`);
      }
    }
  }

  // All found words are at limit → error
  const allEntries = results.flatMap(r => r.entries);
  if (allEntries.length > 0 && allEntries.every(e => e.atLimit)) {
    console.log(`\n  ${RED('✗')} All words are at limit (${limit}). Zin not added.\n`);
    process.exit(1);
  }

  // Generate ID, write to zin file
  const allZins = loadAllZins();

  // Reject duplicate sentences
  for (const [existingId, existingMarked] of allZins.entries()) {
    if (existingMarked === marked) {
      console.log(`\n  ${RED('✗')} Duplicate sentence — already exists as ${BOLD(existingId)}\n`);
      process.exit(2);
    }
  }

  const id = generateId(new Set(allZins.keys()));
  const { file: zinFile, data: zinData } = getActiveZinFile();
  zinData[id] = marked;
  saveZinFile(zinFile, zinData);
  console.log(`\n  ${GREEN('✓')} Added ${BOLD(id)} → ${DIM(zinFile)}`);

  // Add ID to word files (skip entries at limit or not found)
  for (const { base, entries } of results) {
    if (entries.length === 0) continue;
    for (const { wp, atLimit } of entries) {
      if (atLimit) {
        console.log(`  ${AMBER('~')} ${base} skipped (at limit ${limit})  ${DIM(wp.file)}`);
        continue;
      }
      const path = join(DATA_DIR, wp.file);
      const words: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
      const idx = words.findIndex(w => w.nl === wp.word.nl && w.type === wp.word.type);
      if (idx !== -1) {
        if (!words[idx].zinnen) words[idx].zinnen = [];
        words[idx].zinnen!.push(id);
        writeFileSync(path, JSON.stringify(words, null, 2) + '\n', 'utf-8');
        console.log(`  ${GREEN('✓')} ${base}  ${DIM(wp.file)}`);
      }
    }
  }
  console.log('');
}

async function cmdRemoveZin(args: string[]) {
  const zinId = args[0];
  if (!zinId) {
    console.error('Usage: woorden remove-zin <id>');
    process.exit(1);
  }

  const allZins = loadAllZins();
  const found = allZins.get(zinId);
  if (!found) {
    console.error(`\n  Zin "${zinId}" not found.\n`);
    process.exit(1);
  }

  const { marked, file } = found;
  const { clean } = parseMarked(marked);

  console.log(`\n  ${BOLD(zinId)}  ${DIM(file)}`);
  console.log(`  ${clean}`);
  console.log(`  ${DIM(marked)}`);

  // Find all word files referencing this ID
  const allFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && filenameToPack(f));
  const wordRefs: Array<{ nl: string; file: string }> = [];
  for (const wf of allFiles) {
    const words: WordEntry[] = JSON.parse(readFileSync(join(DATA_DIR, wf), 'utf-8'));
    for (const w of words) {
      if (w.zinnen?.includes(zinId)) wordRefs.push({ nl: w.nl, file: wf });
    }
  }

  if (wordRefs.length > 0) {
    console.log(`  Referenced in: ${wordRefs.map(r => r.nl).join(', ')}`);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>(resolve => rl.question(`\n  Remove this zin? [y/N]  `, resolve));
  rl.close();

  if (answer.trim().toLowerCase() !== 'y') { console.log('  Cancelled.\n'); return; }

  // Remove from zin file
  const zinData = loadZinFile(file);
  delete zinData[zinId];
  saveZinFile(file, zinData);
  console.log(`\n  ${GREEN('✓')} Removed from ${DIM(file)}`);

  // Remove ID from word files
  for (const { nl, file: wf } of wordRefs) {
    const path = join(DATA_DIR, wf);
    const words: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
    for (const w of words) {
      if (w.zinnen) w.zinnen = w.zinnen.filter(id => id !== zinId);
    }
    writeFileSync(path, JSON.stringify(words, null, 2) + '\n', 'utf-8');
    console.log(`  ${GREEN('✓')} Removed from ${nl}  ${DIM(wf)}`);
  }
  console.log('');
}

function cmdGetNoZin(args: string[]) {
  const packArg = args[0];
  const countArg = args[1];

  if (!packArg || packArg.startsWith('--')) {
    console.error('Usage: woorden get-no-zin <PACK> [count]');
    console.error('       count defaults to 5');
    process.exit(1);
  }

  const targetPack = normalizePack(packArg);
  const count = parseInt(countArg) || 5;
  const allWords = loadAllWords();

  if (!allWords.has(targetPack)) {
    console.error(`Pack "${targetPack}" not found. Available: ${[...allWords.keys()].join(', ')}`);
    process.exit(1);
  }

  const noZin = allWords.get(targetPack)!.filter(wp => !wp.word.zinnen?.length);

  if (noZin.length === 0) {
    console.log(`\n  ${GREEN('✓')} All words in ${targetPack} have example sentences.\n`);
    return;
  }

  const slice = noZin.slice(0, count);

  console.log(`\n  ${BOLD(targetPack)} — words without zinnen: ${noZin.length} (showing ${slice.length})\n`);

  for (const { word: w } of slice) {
    const parts: string[] = [w.type.padEnd(6), BOLD(w.nl)];
    if (w.article) parts.push(w.article);
    if (w.perfectum) parts.push(w.perfectum);
    if (w.imperfectum) parts.push(w.imperfectum);
    console.log('  ' + parts.join('  '));
  }

  console.log(`\n  ${DIM(`${noZin.length - slice.length} more without zinnen`)}\n`);
}

// ─── Check ────────────────────────────────────────────────────────────────────

function cmdCheckVanWoord(args: string[]) {
  const fix = args.includes('--fix');
  const allZins = loadAllZins();
  const allWords = loadAllWords();

  let totalWords = 0;
  let totalIds = 0;
  let badCount = 0;
  let missingCount = 0;
  let removed = 0;
  let added = 0;

  // Build reverse index: base nl → zin IDs that reference it
  const zinsByBase = new Map<string, string[]>();
  for (const [id, { marked }] of allZins.entries()) {
    const { groups } = parseMarked(marked);
    for (const { base } of groups.values()) {
      const key = base.toLowerCase();
      if (!zinsByBase.has(key)) zinsByBase.set(key, []);
      zinsByBase.get(key)!.push(id);
    }
  }

  for (const words of allWords.values()) {
    for (const { word, file } of words) {
      totalWords++;
      const currentZinnen = word.zinnen ?? [];
      const badIds: string[] = [];

      // Check existing references for validity
      for (const id of currentZinnen) {
        totalIds++;
        const zinEntry = allZins.get(id);

        if (!zinEntry) {
          badIds.push(id);
          badCount++;
          console.log(`  ${RED('✗')} ${word.nl}  ${id}(no-sentence)`);
          continue;
        }

        const { groups } = parseMarked(zinEntry.marked);
        const bases = [...groups.values()].map(g => g.base.toLowerCase());
        if (!bases.includes(word.nl.toLowerCase())) {
          badIds.push(id);
          badCount++;
          console.log(`  ${RED('✗')} ${word.nl}  ${id}(not-in-sentence) >> ${zinEntry.marked} > ${zinLocation(zinEntry)}`);
        }
      }

      // Find zin IDs that reference this word but are missing from zinnen
      const referencingIds = zinsByBase.get(word.nl.toLowerCase()) ?? [];
      const missingIds = referencingIds.filter(id => !currentZinnen.includes(id) && !badIds.includes(id));

      for (const id of missingIds) {
        missingCount++;
        const zinEntry = allZins.get(id)!;
        console.log(`  ${AMBER('+')} ${word.nl}  ${id}(missing) >> ${zinEntry.marked} > ${zinLocation(zinEntry)}`);
      }

      if (fix && (badIds.length > 0 || missingIds.length > 0)) {
        const path = join(DATA_DIR, file);
        const fileWords: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
        const idx = fileWords.findIndex(w => w.nl === word.nl && w.type === word.type);
        if (idx !== -1) {
          const cleaned = (fileWords[idx].zinnen ?? []).filter(id => !badIds.includes(id));
          fileWords[idx].zinnen = [...cleaned, ...missingIds];
          writeFileSync(path, JSON.stringify(fileWords, null, 2) + '\n', 'utf-8');
          removed += badIds.length;
          added += missingIds.length;
        }
      }
    }
  }

  if (fix) {
    if (removed > 0) console.log(`\n  ${GREEN('✓')} Removed ${removed} bad reference(s)`);
    if (added > 0) console.log(`  ${GREEN('✓')} Added ${added} missing reference(s)`);
  }
  console.log(`\n  ${totalWords} words checked, ${totalIds} zinnen refs, ${badCount} bad, ${missingCount} missing${fix ? ' — fixed' : ''}\n`);
}

function cmdCheck(args: string[]) {
  if (args.includes('--van-woord')) return cmdCheckVanWoord(args);

  const hideNotFound = args.includes('--hide-not-found');
  const fix = args.includes('--fix');

  const allZins = loadAllZins();
  const allWords = loadAllWords();

  let total = 0;
  let ok = 0;
  let fixed = 0;

  for (const [id, { marked, file, line }] of allZins.entries()) {
    total++;
    const { groups } = parseMarked(marked);
    if (groups.size === 0) continue;

    const problems: string[] = [];

    for (const [, { base }] of groups.entries()) {
      const wps = findAllWordEntries(base, allWords);
      if (wps.length === 0) {
        if (!hideNotFound) problems.push(`${base}(not-found)`);
        continue;
      }
      for (const wp of wps) {
        const attached = wp.word.zinnen?.includes(id) ?? false;
        if (!attached) {
          if (fix) {
            const path = join(DATA_DIR, wp.file);
            const words: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
            const idx = words.findIndex(w => w.nl === wp.word.nl && w.type === wp.word.type);
            if (idx !== -1) {
              if (!words[idx].zinnen) words[idx].zinnen = [];
              words[idx].zinnen!.push(id);
              writeFileSync(path, JSON.stringify(words, null, 2) + '\n', 'utf-8');
              fixed++;
            }
          } else {
            problems.push(`${base}(not-attached:${wp.pack})`);
          }
        }
      }
    }

    if (problems.length === 0) {
      ok++;
    } else {
      console.log(`${id}: ${problems.join(' ')} >> ${marked} > ${zinLocation({ file, line })} `);
    }
  }

  if (fix && fixed > 0) console.log(`\n  ${GREEN('✓')} Fixed ${fixed} attachment(s)`);
  console.log(`\n  ${total} zinnen, ${ok + (fix ? fixed : 0)} ok, ${total - ok - (fix ? fixed : 0)} with problems`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const [, , command, ...rest] = process.argv;

switch (command) {
  case 'find-duplicate':
    cmdFindDuplicate(rest);
    break;
  case 'remove':
    cmdRemove(rest).catch(err => { console.error(err); process.exit(1); });
    break;
  case 'add-zin':
    cmdAddZin(rest);
    break;
  case 'remove-zin':
    cmdRemoveZin(rest).catch(err => { console.error(err); process.exit(1); });
    break;
  case 'get-no-zin':
    cmdGetNoZin(rest);
    break;
  case 'check':
    cmdCheck(rest);
    break;
  default:
    console.log(`
  woorden — Dutch word pack CLI

  Commands:
    find-duplicate <PACK> [--page N]           Show words in PACK that also appear in higher packs
    remove <PACK> <word>                       Remove a specific word from PACK
    add-zin "<marked>" [--limit N]             Add an example sentence (default limit: 5 per word)
    remove-zin <id>                            Remove a sentence and clean up word references
    get-no-zin <PACK> [count]                  List words without example sentences (default: 5)
    check [--hide-not-found] [--fix]           Check all zinnen for broken word references
    check --van-woord [--fix]                  Check all words' zinnen refs (no-sentence / not-in-sentence)

  Packs:  A1  A2  A2+

  Zin notation:
    N|token@base   — mark word, embed base form (N = group number)
    N|token        — subsequent part of same group (inherits base from first @)
    Example:  "ik 1|ga@gaan naar 2|school"
    Separable:  "hij 1|denkt@nadenken over het 1|na"

  Examples:
    npm run woorden find-duplicate A1
    npm run woorden remove A1 groot
    npm run woorden get-no-zin A1
    npm run woorden get-no-zin A1 10
    npm run woorden -- add-zin "ik 1|ga@gaan naar 2|school"
    npm run woorden -- add-zin "ik 1|ga@gaan naar 2|school" --limit 6
    npm run woorden remove-zin ab3k9x2m
`);
    if (command) process.exit(1);
}

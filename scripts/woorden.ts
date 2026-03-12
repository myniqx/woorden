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
const MAX_ZINNEN_PER_FILE = 100;

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

function findWordEntry(nl: string, allWords: Map<string, WordInPack[]>): WordInPack | null {
  for (const words of allWords.values()) {
    const found = words.find(wp => wp.word.nl === nl);
    if (found) return found;
  }
  return null;
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

function loadAllZins(): Map<string, { marked: string; file: string }> {
  const result = new Map<string, { marked: string; file: string }>();
  for (const file of getZinFiles()) {
    const data = loadZinFile(file);
    for (const [id, marked] of Object.entries(data)) result.set(id, { marked, file });
  }
  return result;
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
 * Parse "ik 1|denk 2|over hen 1|aan"
 * → clean: "ik denk over hen aan"
 * → groups: Map { 1 → ["denk","aan"], 2 → ["over"] }
 */
function parseMarked(marked: string): { clean: string; groups: Map<number, string[]> } {
  const tokens = marked.trim().split(/\s+/);
  const groups = new Map<number, string[]>();
  const cleanTokens: string[] = [];

  for (const token of tokens) {
    const m = token.match(/^(\d+)\|(.+)$/);
    if (m) {
      const num = parseInt(m[1]);
      if (!groups.has(num)) groups.set(num, []);
      groups.get(num)!.push(m[2]);
      cleanTokens.push(m[2]);
    } else {
      cleanTokens.push(token);
    }
  }
  return { clean: cleanTokens.join(' '), groups };
}

/** Render with one word group bolded, strip notation from rest */
function renderHighlight(marked: string, activeNum: number): string {
  return marked.trim().split(/\s+/).map(token => {
    const m = token.match(/^(\d+)\|(.+)$/);
    if (!m) return token;
    return parseInt(m[1]) === activeNum ? BOLD(m[2]) : m[2];
  }).join(' ');
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const BOLD  = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM   = (s: string) => `\x1b[2m${s}\x1b[0m`;
const GREEN = (s: string) => `\x1b[32m${s}\x1b[0m`;
const AMBER = (s: string) => `\x1b[33m${s}\x1b[0m`;
const RED   = (s: string) => `\x1b[31m${s}\x1b[0m`;

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
    if (w.perfectum)   parts.push(`perfectum: ${w.perfectum}`);
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
      match === 'similar'   ? AMBER('~ SIMILAR   — translations differ slightly, review before removing') :
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
  const nlWord  = args[1];

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

async function cmdAddZin(args: string[]) {
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? (parseInt(args[limitIdx + 1]) || DEFAULT_ZIN_LIMIT) : DEFAULT_ZIN_LIMIT;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

  // Step 1: get marked sentence
  const markedArg = args.filter(a => !a.startsWith('--') && !/^\d+$/.test(a))[0];
  const marked = markedArg || (await ask('\n  Zin (with notation): ')).trim();

  const { clean, groups } = parseMarked(marked);
  if (groups.size === 0) {
    console.log(`  No annotated words found. Use notation like: ik 1|ga naar 2|school`);
    rl.close();
    return;
  }

  // Step 2: get nl base form for each group number
  const sortedNums = [...groups.keys()].sort((a, b) => a - b);
  const nlMap = new Map<number, string>();
  for (const num of sortedNums) {
    const tokens = groups.get(num)!;
    const nl = (await ask(`  Word ${num} [${tokens.join('...')}] (nl form): `)).trim();
    nlMap.set(num, nl);
  }
  rl.close();

  // Step 3: preview
  console.log(`\n  Clean:  ${clean}`);
  for (const [num, nl] of nlMap) {
    console.log(`  Word ${num} (${nl}):  ${renderHighlight(marked, num)}`);
  }
  console.log('');

  // Step 4: look up words and check limits
  const allWords = loadAllWords();
  const nlForms = [...nlMap.values()];

  type WordResult = { nl: string; wp: WordInPack | null; zinCount: number; atLimit: boolean };
  const results: WordResult[] = [];

  for (const nl of nlForms) {
    const wp = findWordEntry(nl, allWords);
    const zinCount = wp?.word.zinnen?.length ?? 0;
    const atLimit = zinCount >= limit;
    results.push({ nl, wp, zinCount, atLimit });

    if (!wp) {
      console.log(`  ${RED('✗')} "${nl}" not found in any pack`);
    } else {
      const limitTag = atLimit ? RED(` ← at limit`) : '';
      console.log(`  ${atLimit ? AMBER('~') : GREEN('✓')} ${nl.padEnd(20)} ${wp.pack}  ${DIM(wp.file)}  zinnen: ${zinCount}/${limit}${limitTag}`);
    }
  }

  // All found words are at limit → error
  const foundResults = results.filter(r => r.wp !== null);
  if (foundResults.length > 0 && foundResults.every(r => r.atLimit)) {
    console.log(`\n  ${RED('✗')} All words are at limit (${limit}). Zin not added.\n`);
    return;
  }

  // Step 5: generate ID, write to zin file
  const allZins = loadAllZins();
  const id = generateId(new Set(allZins.keys()));
  const { file: zinFile, data: zinData } = getActiveZinFile();
  zinData[id] = marked;
  saveZinFile(zinFile, zinData);
  console.log(`\n  ${GREEN('✓')} Added ${BOLD(id)} → ${DIM(zinFile)}`);

  // Step 6: add ID to word files (skip words at limit or not found)
  for (const { nl, wp, atLimit } of results) {
    if (!wp) continue;
    if (atLimit) {
      console.log(`  ${AMBER('~')} ${nl} skipped (at limit ${limit})`);
      continue;
    }
    const path = join(DATA_DIR, wp.file);
    const words: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
    const idx = words.findIndex(w => w.nl === wp.word.nl && w.type === wp.word.type);
    if (idx !== -1) {
      if (!words[idx].zinnen) words[idx].zinnen = [];
      words[idx].zinnen!.push(id);
      writeFileSync(path, JSON.stringify(words, null, 2) + '\n', 'utf-8');
      console.log(`  ${GREEN('✓')} ${nl}  ${DIM(wp.file)}`);
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
    if (w.article)     parts.push(w.article);
    if (w.perfectum)   parts.push(w.perfectum);
    if (w.imperfectum) parts.push(w.imperfectum);
    console.log('  ' + parts.join('  '));
  }

  console.log(`\n  ${DIM(`${noZin.length - slice.length} more without zinnen`)}\n`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const [,, command, ...rest] = process.argv;

switch (command) {
  case 'find-duplicate':
    cmdFindDuplicate(rest);
    break;
  case 'remove':
    cmdRemove(rest).catch(err => { console.error(err); process.exit(1); });
    break;
  case 'add-zin':
    cmdAddZin(rest).catch(err => { console.error(err); process.exit(1); });
    break;
  case 'remove-zin':
    cmdRemoveZin(rest).catch(err => { console.error(err); process.exit(1); });
    break;
  case 'get-no-zin':
    cmdGetNoZin(rest);
    break;
  default:
    console.log(`
  woorden — Dutch word pack CLI

  Commands:
    find-duplicate <PACK> [--page N]   Show words in PACK that also appear in higher packs
    remove <PACK> <word>               Remove a specific word from PACK
    add-zin [--limit N]                Add an example sentence (default limit: 5 per word)
    remove-zin <id>                    Remove a sentence and clean up word references
    get-no-zin <PACK> [count]          List words without example sentences (default: 5)

  Packs:  A1  A2  A2+

  Examples:
    npm run woorden find-duplicate A1
    npm run woorden remove A1 groot
    npm run woorden get-no-zin A1
    npm run woorden get-no-zin A1 10
    npm run woorden add-zin
    npm run woorden add-zin --limit 6
    npm run woorden remove-zin ab3k9x2m
`);
    if (command) process.exit(1);
}

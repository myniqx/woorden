#!/usr/bin/env node
/**
 * woorden — CLI tool for managing Dutch word packs
 *
 * Commands:
 *   find-duplicate <PACK> [--page N]   Find words in PACK that also exist in other packs
 *   remove <PACK>                       Remove those duplicates from PACK (with confirmation)
 *
 * Duplicate key: nl + type  →  same word as different type (noun vs verb) is NOT a duplicate
 *
 * Usage:
 *   npm run woorden find-duplicate A1
 *   npm run woorden find-duplicate A1 --page 2
 *   npm run woorden remove A2
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/data');
const PAGE_SIZE = 5;

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

interface WordInPack {
  word: WordEntry;
  pack: string;
  file: string;
}

interface Duplicate {
  key: string;
  entries: WordInPack[]; // [0] = from target pack, rest = from other packs
}

// ─── Pack helpers ─────────────────────────────────────────────────────────────

/** a1-001.json → "A1",  a2p-003.json → "A2+" */
function filenameToPack(filename: string): string {
  const m = filename.match(/^(a\d+p?)-\d+\.json$/);
  if (!m) return '';
  return m[1] === 'a2p' ? 'A2+' : m[1].toUpperCase();
}

/** Normalise user input: "a2p" | "a2+" | "A2+" → "A2+" */
function normalizePack(arg: string): string {
  const lower = arg.toLowerCase().replace('+', 'p'); // a2+ → a2p
  if (lower === 'a2p') return 'A2+';
  return lower.replace('a', 'A'); // a1 → A1, a2 → A2
}

// ─── Data loading ─────────────────────────────────────────────────────────────

function loadAllWords(): Map<string, WordInPack[]> {
  const packMap = new Map<string, WordInPack[]>();

  const files = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  for (const file of files) {
    const pack = filenameToPack(file);
    if (!pack) continue;

    const words: WordEntry[] = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
    if (!packMap.has(pack)) packMap.set(pack, []);
    for (const word of words) {
      packMap.get(pack)!.push({ word, pack, file });
    }
  }

  return packMap;
}

// ─── Duplicate logic ──────────────────────────────────────────────────────────

/** nl + type = unique identity.  Same nl, different type = legitimately different word. */
function dupKey(w: WordEntry): string {
  return `${w.nl}::${w.type}`;
}

function findDuplicates(targetPack: string, allWords: Map<string, WordInPack[]>): Duplicate[] {
  const targetWords = allWords.get(targetPack)!;

  // Index all words from OTHER packs by dupKey
  const otherIndex = new Map<string, WordInPack[]>();
  for (const [pack, words] of allWords) {
    if (pack === targetPack) continue;
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
    if (others?.length) {
      duplicates.push({ key: k, entries: [wp, ...others] });
    }
  }

  return duplicates;
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

  // Article / diminutive line (nouns)
  if (w.article) {
    const dim = w.diminutive ? `  diminutive: ${w.diminutive}` : '';
    lines.push(`article: ${w.article}${dim}`);
  }

  // Verb forms
  if (w.perfectum || w.imperfectum) {
    const parts: string[] = [];
    if (w.perfectum)   parts.push(`perfectum: ${w.perfectum}`);
    if (w.imperfectum) parts.push(`imperfectum: ${w.imperfectum}`);
    lines.push(parts.join('   '));
  }

  // Translations — print each language on its own column-ish slot
  const langs: Array<keyof WordEntry> = ['en', 'tr', 'fr', 'ar'];
  const transParts = langs
    .filter(l => w[l])
    .map(l => `${l}: ${w[l]}`);
  if (transParts.length) lines.push(transParts.join('   '));

  return lines;
}

function printDuplicate(dup: Duplicate, index: number, total: number) {
  const [target, ...others] = dup.entries;
  const w = target.word;

  console.log(`\n  [${index}/${total}]  ${BOLD(w.nl)}   type: ${w.type}`);
  console.log('  ' + '─'.repeat(60));

  const allEntries = [target, ...others];
  for (let i = 0; i < allEntries.length; i++) {
    const { word, pack, file } = allEntries[i];
    const corner = i === 0 ? '┌─' : i < allEntries.length - 1 ? '├─' : '└─';
    const packTag = pack.padEnd(4);
    console.log(`  ${corner} ${BOLD(packTag)}  ${DIM(file)}`);

    for (const line of entryLines(word)) {
      console.log(`       ${line}`);
    }
  }

  // Summary verdict (only makes sense when exactly 2 entries)
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
    console.error('       Packs: A1, A2, A2+');
    process.exit(1);
  }

  const targetPack = normalizePack(packArg);
  const pageIdx = args.indexOf('--page');
  const page = pageIdx >= 0 ? (parseInt(args[pageIdx + 1]) || 1) : 1;

  const allWords = loadAllWords();

  if (!allWords.has(targetPack)) {
    const available = [...allWords.keys()].join(', ');
    console.error(`Pack "${targetPack}" not found. Available: ${available}`);
    process.exit(1);
  }

  // Pack summary
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

  for (let i = 0; i < slice.length; i++) {
    printDuplicate(slice[i], start + i + 1, duplicates.length);
  }

  if (clampedPage < totalPages) {
    console.log(`\n  Next page:  woorden find-duplicate ${packArg} --page ${clampedPage + 1}`);
  }

  console.log(`\n  To remove a word:  woorden remove ${packArg} <word>\n`);
}

function removeWordFromFile(file: string, keyToRemove: string): boolean {
  const path = join(DATA_DIR, file);
  const words: WordEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
  const filtered = words.filter(w => dupKey(w) !== keyToRemove);
  if (filtered.length === words.length) return false;
  writeFileSync(path, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
  return true;
}

async function cmdRemove(args: string[]) {
  const packArg = args[0];
  const nlWord  = args[1];

  if (!packArg || packArg.startsWith('--') || !nlWord) {
    console.error('Usage: woorden remove <PACK> <word>');
    console.error('       Example: woorden remove A1 groot');
    process.exit(1);
  }

  const targetPack = normalizePack(packArg);
  const allWords = loadAllWords();

  if (!allWords.has(targetPack)) {
    const available = [...allWords.keys()].join(', ');
    console.error(`Pack "${targetPack}" not found. Available: ${available}`);
    process.exit(1);
  }

  // Find all entries in target pack matching nl word
  const matches = allWords.get(targetPack)!.filter(wp => wp.word.nl === nlWord);

  if (matches.length === 0) {
    console.log(`\n  "${nlWord}" not found in ${targetPack}.\n`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

  let toDelete: WordInPack;

  if (matches.length === 1) {
    // Single match — show it and confirm
    const wp = matches[0];
    console.log(`\n  Found in ${BOLD(targetPack)}  ${DIM(wp.file)}`);
    for (const line of entryLines(wp.word)) {
      console.log(`    ${line}`);
    }
    const answer = await ask(`\n  Remove "${nlWord}" (${wp.word.type}) from ${BOLD(targetPack)}? [y/N]  `);
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('  Cancelled.\n');
      return;
    }
    toDelete = wp;
  } else {
    // Multiple types — let user pick
    console.log(`\n  "${nlWord}" appears ${matches.length} times in ${BOLD(targetPack)} with different types:\n`);
    for (let i = 0; i < matches.length; i++) {
      const { word, file } = matches[i];
      console.log(`  [${i + 1}]  type: ${BOLD(word.type)}   ${DIM(file)}`);
      for (const line of entryLines(word)) {
        console.log(`       ${line}`);
      }
      console.log('');
    }
    const answer = await ask(`  Which to remove? [1-${matches.length}] or [n] to cancel:  `);
    rl.close();
    const idx = parseInt(answer.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= matches.length) {
      console.log('  Cancelled.\n');
      return;
    }
    toDelete = matches[idx];
  }

  const removed = removeWordFromFile(toDelete.file, dupKey(toDelete.word));
  if (removed) {
    console.log(`\n  ${GREEN('✓')} Removed "${nlWord}" (${toDelete.word.type}) from ${DIM(toDelete.file)}\n`);
  } else {
    console.error(`  Could not remove word from file.\n`);
  }
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
  default:
    console.log(`
  woorden — Dutch word pack CLI

  Commands:
    find-duplicate <PACK> [--page N]   Show words in PACK that also appear in other packs
    remove <PACK> <word>                Remove a specific word from PACK

  Packs:  A1  A2  A2+

  Examples:
    npm run woorden find-duplicate A1
    npm run woorden find-duplicate A2 --page 2
    npm run woorden remove A1 groot
    npm run woorden remove A2 bank      # asks which type if nl appears multiple times
`);
    if (command) process.exit(1);
}

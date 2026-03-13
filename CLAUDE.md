# Woorden - Dutch Vocabulary Learning App

## Project Overview

A Progressive Web App (PWA) for learning Dutch vocabulary with spaced repetition. Built with Preact + TypeScript + Vite.

## Tech Stack

- **Frontend:** Preact (React-like, ~3KB)
- **Language:** TypeScript
- **Build:** Vite
- **Icons:** Lucide
- **PWA:** vite-plugin-pwa + Workbox
- **Styling:** CSS Variables (custom theme system)

## Project Structure

```
src/
├── components/       # Preact components (.tsx + .css)
│   ├── Header.tsx       # Logo, streak, progress, language selector, settings
│   ├── MainMenu.tsx     # Quiz type selection cards
│   ├── QuizScreen.tsx   # Multiple choice quiz interface
│   ├── InputQuizScreen.tsx # Input-based quiz (writing, verb forms)
│   ├── OptionButton.tsx # Multiple choice button
│   ├── StatsFooter.tsx  # Expandable stats panel, PWA update button
│   ├── SettingsModal.tsx # Theme toggle, data export/import
│   └── WordListModal.tsx # Word list by category
├── data/
│   ├── a2-*.json        # Word data files
│   ├── translations.ts  # UI translations (tr/en/ar/fr)
│   └── WORD_ENTRY_GUIDE.md # Word entry format guide
├── hooks/
│   ├── useTheme.ts      # Dark/light mode
│   └── useLanguage.ts   # UI language selection
├── services/
│   ├── storage.ts       # localStorage + migration logic
│   ├── words.ts         # Word data loading
│   ├── wordSelector.ts  # Spaced repetition algorithm
│   └── quiz.ts          # Quiz creation & answer handling
├── styles/
│   ├── theme.css        # CSS variables, base styles
│   └── app.css          # App layout, animations
├── types/
│   ├── word.ts          # Word, WordProgress, SkillProgress types
│   └── quiz.ts          # Quiz, QuizType types
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## Data Format

### Word Entry (JSON)

```json
{
  "nl": "gaan",
  "type": "verb",
  "perfectum": "gegaan",
  "imperfectum": "ging",
  "tr": "gitmek",
  "en": "to go",
  "ar": "يذهب",
  "fr": "aller"
}
```

Types: `noun`, `verb`, `adj`, `adv`, `prep`, `conj`, `phrase`, `num`, `pron`

- Nouns have `article` (de/het) and optional `diminutive`
- Verbs have `perfectum` and `imperfectum`

### Progress Storage (localStorage)

Key: `woorden_app_data`

```json
{
  "language": "tr",
  "wordProgress": {
    "gaan": {
      "firstSeen": 1739800000000,
      "lastSeen": 1739827200000,
      "skills": {
        "translationTo": { "seen": 5, "correct": 4, "wrong": 1, "streak": 2, "lastResult": "correct", "masteredAt": null, "history": ["w","c","c","c","c"] },
        "translationFrom": { ... },
        "article": { ... },
        "verbForms": { ... }
      }
    }
  },
  "dailyStats": { "2024-02-17": { "practiced": 45, "correct": 38 } },
  "streak": 3,
  "lastPracticeDate": "2024-02-17",
  "bestDaily": 120
}
```

### Skill Types

| Quiz Type | Skill | Applies To |
|-----------|-------|------------|
| nativeToDutch | translationTo | All words |
| dutchToNative | translationFrom | All words |
| article | article | Nouns only |
| verbForms | verbForms | Verbs only |

## Key Features

### Implemented
- 5 quiz types (translation both ways, article, writing test, verb forms)
- Input-based quizzes for writing and verb forms
- Spaced repetition (priority based on history, last result)
- Skill-based progress tracking per word
- Dark/light theme (in Settings modal, system preference aware)
- Multi-language UI (TR/EN/AR/FR)
- Stats footer (overall or quiz-specific)
- Word list modal by category
- Daily streak & progress tracking
- Personal best daily goal (min 100)
- Export/Import data (JSON)
- PWA (offline capable, installable)
- PWA update notification (green button in footer when new version available)
- Mobile-optimized header (logo text hidden on small screens)

## Migration

Old `wordStats` (numeric ID based) → New `wordProgress` (nl string based):
- Migration runs on first load if `wordStats` exists but `wordProgress` doesn't
- Old data copied to both `translationTo` and `translationFrom` skills
- `wordStats` kept as backup, not included in export

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Conventions

- Components: PascalCase (.tsx + matching .css)
- Services: camelCase functions, no classes
- Types: PascalCase interfaces, camelCase type aliases
- CSS: BEM-like naming, CSS variables for theming
- No emojis in code/UI unless explicitly requested

## CSS Variables (IMPORTANT)

All CSS must use the variables defined in `src/styles/theme.css`. Do NOT invent new variable names.

### Available Variables

```css
/* Colors */
--color-bg              /* Page background */
--color-surface         /* Card/modal background */
--color-surface-elevated /* Elevated surface */
--color-border          /* Borders */

/* Text */
--color-text-primary    /* Main text */
--color-text-secondary  /* Secondary text */
--color-text-muted      /* Muted/disabled text */

/* Primary (orange) */
--color-primary         /* Primary color (#ff6b35) */
--color-primary-hover   /* Primary hover state */
--color-primary-light   /* Primary light background */

/* Status */
--color-success         /* Success green */
--color-success-light   /* Success background */
--color-error           /* Error red */
--color-error-light     /* Error background */

/* Spacing */
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl

/* Typography */
--text-xs, --text-sm, --text-base, --text-lg, --text-xl, --text-2xl

/* Borders */
--radius-sm, --radius-md, --radius-lg, --radius-full

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg

/* Transitions */
--transition-fast, --transition-normal
```

### Common Mistakes to Avoid

```css
/* WRONG */
background: var(--bg-secondary);
color: var(--text-primary);
border-color: var(--border-color);
background: var(--accent-color);

/* CORRECT */
background: var(--color-surface);
color: var(--color-text-primary);
border-color: var(--color-border);
background: var(--color-primary);
```

## Word Packs System

Words are organized by CEFR levels (A1, A2, B1, B2). Each level can have multiple JSON files.

### Structure

```
src/data/
├── a1-001.json    # A1 level, file 1
├── a1-002.json    # A1 level, file 2
├── a2-001.json    # A2 level, file 1 (existing)
├── a2-002.json    # A2 level, file 2 (existing)
├── ...
├── b1-001.json    # B1 level, file 1
└── b2-001.json    # B2 level, file 1
```

### Adding a New Level

1. Create JSON files: `src/data/{level}-001.json`

2. Update `src/services/words.ts`:

```typescript
// Add imports
import b1Data1 from '../data/b1-001.json';
import b1Data2 from '../data/b1-002.json';

// Add to wordPacks object
export const wordPacks: Record<string, WordEntry[]> = {
  A1: [...] as WordEntry[],
  A2: [...] as WordEntry[],
  B1: [
    ...b1Data1,
    ...b1Data2,
  ] as WordEntry[],
};
```

3. The new pack automatically appears in Settings modal

### User Preferences

- Stored in `localStorage` under `woorden_app_data.enabledPacks`
- Format: `{ "A2": true, "B1": false }`
- `undefined` or `true` = enabled (default)
- `false` = disabled
- Users toggle packs in Settings modal

### Dev-Only Editor

Access `/editor` route in dev mode (`npm run dev`) to:
- Paste HTML tables and convert to word JSON format
- Translate words using DeepL API (requires `VITE_DEEPL_API_KEY` in `.env`)
- Export words as JSON files (100 words per file)

## Woorden CLI (`scripts/woorden.ts`)

Run via `npm run woorden -- <command>`.

### Commands

```bash
# Find words in PACK that also appear in higher-level packs
npm run woorden find-duplicate <PACK> [--page N]

# Remove a specific word from PACK (asks y/N confirmation)
npm run woorden remove <PACK> <word>

# Add an example sentence with notation (see Zin Notation below)
npm run woorden -- add-zin "<marked sentence>" [--limit N]

# Remove a sentence by ID and clean up all word references
npm run woorden remove-zin <id>

# List words without example sentences
npm run woorden get-no-zin <PACK> [count]
```

**Packs:** `A1`, `A2`, `A2+`
**Pack hierarchy:** A1 < A2 < A2+ — `find-duplicate A1` compares against A2 and A2+, `find-duplicate A2` only against A2+.

### Zin Notation

Example sentences are stored in `src/data/zin-*.json` as `{ "<id>": "<marked string>" }`.

Each word being learned is annotated with a group number:

```
N|token@base
```

- `N` — group number (integer, matches one vocabulary word)
- `token` — the surface form as it appears in the sentence (conjugated, capitalized, etc.)
- `@base` — the dictionary form (`nl` key in word JSON); required on the **first** occurrence of group N

**Option B inheritance:** the first occurrence of group N defines the `@base`; subsequent tokens with the same N inherit it automatically — no need to repeat `@base`.

```
# Verb conjugation (surface ≠ infinitive)
"ik 1|ga@gaan naar 2|school"
→ Word 1 base: gaan   (surface: ga)
→ Word 2 base: school (surface = base → @school can be omitted)

# Separable verb: both parts share the same group number
"hij 1|denkt@nadenken over het 1|na"
→ Word 1 base: nadenken  (tokens: denkt, na — both resolve to nadenken)

# Adjective inflection (groot → grote, nieuw → nieuwe, etc.)
"Dat is een 1|grote@groot huis."
→ Word 1 base: groot  (surface: grote, -e added by inflection)

"De 1|nieuwe@nieuw leraar is 2|aardig."
→ Word 1 base: nieuw   (surface: nieuwe)
→ Word 2 base: aardig  (predicative, no inflection → @base can be omitted)

# Plural noun (kind → kinderen, huis → huizen, etc.)
"De 1|kinderen@kind spelen buiten."
→ Word 1 base: kind  (surface: kinderen)

# Capitalised first token
"1|Ik@ik 2|woon@wonen in 3|Nederland."
→ @ik needed because surface is capitalised; @wonen because woon ≠ wonen
```

**When `@base` can be omitted:** when the surface token (after stripping trailing punctuation) already matches the base. Trailing `. , ? ! ; :` are stripped automatically before lookup — so `3|school,` and `3|school.` both resolve to base `school` regardless of position in the sentence.

**Multi-word bases (spaces in `nl` key):** use underscores in `@base` to encode spaces.

```
# nl key: "oppassen op"
Ze 1|paste@oppassen_op op de kinderen 1|op@oppassen_op.
→ base: oppassen op  (tokens: paste, op)

# nl key: "zich scheren"
Ze 1|scheert@zich_scheren zich elke ochtend.
→ base: zich scheren  (token: scheert; "zich" is plain text — do NOT mark it as a separate group)

# nl key: "Europese Unie"  (proper noun — mark first word only)
De 1|Europese@Europese_Unie Unie heeft veel leden.
→ base: Europese Unie  (token: Europese)
```

**Inflected adjectives always need `@base`:**

```
# WRONG — "uitstekende" not found in any pack
Dat was een 1|uitstekende oplossing.

# CORRECT
Dat was een 1|uitstekende@uitstekend oplossing.
Dat is een 1|traditionele@traditioneel familie.
Dat is een 1|financiële@financieel probleem.
```

**Reflexive pronouns (`zich`, `me`, `je`) that are the split-off part of a reflexive verb are NOT marked as a second group token** — they are plain text, only the conjugated verb form carries the group annotation.

**Limit:** default 5 zinnen per word (`--limit N` to override). If ALL referenced words are already at the limit, the sentence is rejected.

### Zin File Format

```json
// src/data/zin-001.json
{
  "ab3k9x2m": "1|Ik@ik 2|ga@gaan naar 3|school",
  "xy9q2rtl": "hij 1|denkt@nadenken over het 1|na"
}
```

Word entries get a `zinnen` array referencing sentence IDs:

```json
{
  "nl": "gaan",
  "type": "verb",
  "zinnen": ["ab3k9x2m"]
}
```

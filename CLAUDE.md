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

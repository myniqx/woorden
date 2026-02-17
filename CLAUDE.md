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
│   ├── Header.tsx       # Logo, streak, progress, language, settings, theme
│   ├── MainMenu.tsx     # Quiz type selection cards
│   ├── QuizScreen.tsx   # Quiz interface
│   ├── OptionButton.tsx # Multiple choice button
│   ├── StatsFooter.tsx  # Expandable stats panel
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
- 3 quiz types (translation both ways, article)
- Spaced repetition (priority based on history, last result)
- Skill-based progress tracking per word
- Dark/light theme (system preference aware)
- Multi-language UI (TR/EN/AR/FR)
- Stats footer (overall or quiz-specific)
- Word list modal by category
- Daily streak & progress tracking
- Personal best daily goal (min 100)
- Export/Import data (JSON)
- PWA (offline capable, installable)

### TODO
- [ ] Verb forms quiz (input-based, not multiple choice)
  - Show infinitief, user types perfectum & imperfectum
  - Case insensitive, trim whitespace

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

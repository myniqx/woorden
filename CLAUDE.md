# Woorden - Dutch Vocabulary Learning App

## Project Overview

A Progressive Web App (PWA) for learning Dutch vocabulary with spaced repetition. Built with Preact + TypeScript + Vite.

## Tech Stack

- **Frontend:** Preact (React-like, ~3KB)
- **Language:** TypeScript
- **Build:** Vite
- **Icons:** Lucide
- **PWA:** vite-plugin-pwa + Workbox
- **Styling:** Tailwind CSS v4 + CSS Variables (theme tokens in `src/styles/theme.css`)

## Project Structure

```
src/
├── components/       # Preact components (.tsx, Tailwind-only — no CSS files)
│   ├── commons/         # Shared UI primitives (no business logic, ALWAYS USE THESE COMPONENTS WHEN U NEED. NEWER WRITE CUSTOM BUTTON or etc.)
│   │   ├── Badge.tsx       # Status/label badge
│   │   ├── Button.tsx      # Multi-variant button
│   │   ├── Modal.tsx       # Overlay + Modal.Header + Modal.Body
│   │   ├── QuizCard.tsx    # Quiz question card (type label, pin, help, question)
│   │   ├── ResultBanner.tsx # Correct/incorrect result with skill stats
│   │   └── index.ts        # Re-exports all commons
│   ├── profile-screen/  # Complex multi-tab screen (own folder)
│   │   ├── index.ts
│   │   ├── ProfileScreen.tsx
│   │   ├── LeaderboardTab.tsx
│   │   ├── ProfileTab.tsx
│   │   ├── SettingsTab.tsx
│   │   ├── AITab.tsx        # AI provider list tab
│   │   ├── AIProviderCard.tsx # Per-provider key entry + confirm + save
│   │   └── types.ts
│   ├── Header.tsx          # Logo, daily progress, language selector, profile button
│   ├── MainMenu.tsx        # Quiz type selection cards, word pool button
│   ├── QuizScreen.tsx      # Multiple choice quiz interface
│   ├── InputQuizScreen.tsx # Input-based quiz (writing, verb forms)
│   ├── OptionButton.tsx    # Multiple choice button
│   ├── StatsFooter.tsx     # Expandable stats panel, PWA update button
│   ├── AlertBanner.tsx     # Dismissible info banners
│   ├── AvatarPicker.tsx    # Avatar grid + Avatar component
│   ├── ChangelogScreen.tsx # Version history screen
│   ├── ExampleZin.tsx      # Highlighted example sentence
│   ├── HelpModal.tsx       # Help overlay (uses Modal)
│   ├── SupportButton.tsx   # Ko-fi support button
│   ├── WordListModal.tsx   # Word list by category (uses Modal)
│   └── WordPoolModal.tsx   # Word pack selection (uses Modal)
├── data/
│   ├── a2-*.json        # Word data files
│   ├── translations.ts  # UI translations (tr/en/ar/fr)
│   └── WORD_ENTRY_GUIDE.md # Word entry format guide
├── hooks/
│   ├── useTheme.ts      # Dark/light mode
│   ├── useLanguage.ts   # UI language selection
│   └── useAI.ts         # AI streaming hook (submit/result/isStreaming/doneStreaming/setProvider)
├── services/
│   ├── storage.ts       # localStorage + migration logic
│   ├── words.ts         # Word data loading
│   ├── wordSelector.ts  # Spaced repetition algorithm
│   ├── quiz.ts          # Quiz creation & answer handling
│   └── ai/              # Client-side AI adapter layer
│       ├── types.ts         # AIAdapter interface, AIProvider, ProviderType
│       ├── manager.ts       # Chunk accumulation + completeJson + JSON parse (single place)
│       ├── providerStorage.ts # localStorage API key management
│       ├── index.ts         # Re-exports
│       └── adapters/
│           ├── gemini.ts    # Google Gemini SSE streaming
│           ├── groq.ts      # Groq SSE streaming
│           └── server.ts    # Future server proxy
├── styles/
│   ├── theme.css        # CSS variables, keyframe animations, utility classes
│   └── app.css          # App layout
├── types/
│   ├── word.ts          # Word, WordProgress, SkillProgress types
│   └── quiz.ts          # Quiz, QuizType types
├── utils/
│   ├── textUtils.ts     # Text helpers
│   └── completeJson.ts  # Repairs partial/truncated JSON (used by AI streaming)
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
- Client-side AI (user-provided API keys, Gemini + Groq, streaming structured JSON)

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

- Components: PascalCase `.tsx` — **no separate CSS files**, all styling via Tailwind
- Services: camelCase functions, no classes
- Types: PascalCase interfaces, camelCase type aliases
- Styling: Tailwind v4 canonical syntax; use direct aliases for color/radius/text tokens (e.g. `bg-primary`, `text-sm`, `rounded-md`); CSS variable shorthand only for transition/shadow (e.g. `duration-(--transition-fast)`, `shadow-(--shadow-md)`)
- No emojis in code/UI unless explicitly requested

## Theme Tokens (IMPORTANT)

All styling uses Tailwind with CSS variable references from `src/styles/theme.css`. Do NOT invent new variable names.

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

/* Typography */
--text-xs, --text-sm, --text-base, --text-lg, --text-xl, --text-2xl

/* Borders */
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg

/* Transitions */
--transition-fast, --transition-normal, --transition-slow
```

### Tailwind Usage Pattern

All `--color-*`, `--radius-*`, `--text-*` tokens are inside `@theme {}` so Tailwind generates
direct aliases. Use them — never write `var(--...)` wrappers in class strings.

**Color tokens → direct alias:**
```
bg-primary        bg-primary-light    bg-primary-hover
bg-surface        bg-surface-elevated bg-bg               bg-border
bg-success-light  bg-error-light      bg-text-muted
text-primary      text-text-primary   text-text-secondary  text-text-muted
text-success      text-error          text-surface
border-border     border-primary      border-primary-hover
from-primary      to-primary-hover
accent-primary
```

**Text size tokens → direct alias:**
```
text-xs   text-sm   text-base   text-lg   text-xl   text-2xl   text-3xl
```

**Radius tokens → direct alias:**
```
rounded-sm   rounded-md   rounded-lg   rounded-xl   rounded-full
```

**Gradient direction:**
```
bg-linear-to-r   bg-linear-to-br   (NOT bg-gradient-to-*)
```

**Transition / shadow → NO alias, use CSS variable shorthand:**
```tsx
duration-(--transition-fast)    duration-(--transition-normal)    duration-(--transition-slow)
shadow-(--shadow-sm)            shadow-(--shadow-md)              shadow-(--shadow-lg)
```

**Spacing → standard Tailwind scale (px-4 = 1rem, px-2 = 0.5rem, etc.):**
```tsx
px-4   py-2   gap-2   mx-auto
```

**Never use `[var(--...)]` bracket syntax:**
```tsx
// WRONG
<div class="bg-[var(--color-primary)] text-[length:var(--text-sm)] bg-gradient-to-r">

// CORRECT
<div class="bg-primary text-sm bg-linear-to-r">
```

### Common Mistakes to Avoid

```tsx
// WRONG — old variable names (renamed)
bg-[var(--bg-secondary)]     →  bg-surface
text-[var(--text-primary)]   →  text-text-primary
border-[var(--border-color)] →  border-border
```

### Global Utility Classes (theme.css)

These animation classes are defined in `theme.css` and can be used directly:

```
fade-in        — fadeIn animation
scale-in       — scaleIn animation (modals)
shake          — horizontal shake (wrong answer)
level-up       — scale bounce (daily level up)
pulse-glow     — green glow pulse (update button)
changelog-glow — orange glow pulse (new changelog)
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

## AI Layer

Client-side AI with user-provided API keys. No server proxy — keys stored in localStorage.

### Architecture

```
useAI<T>() hook (one-shot JSON)      useAIChat() hook (multi-turn text, historyLimit windowing, abort)
    ↓                                    ↓
streamObject() in manager.ts         streamChat() in manager.ts  ← accumulation + truncation flag
    ↓                                    ↓
AIAdapter interface  ← stream(prompt, opts?) / chat(system, messages, opts?): AsyncIterable<string>
    ↓                   opts: { signal, temperature, maxTokens, onFinish }
streamSSE() in sse.ts  ← shared fetch + SSE parsing + AIError mapping (one place)
    ↓
GeminiAdapter / GroqAdapter / OllamaAdapter / LMStudioAdapter / ServerAdapter
```

### Errors

All adapter failures are thrown as `AIError` (`src/services/ai/errors.ts`) with `kind`:
`rate_limit | auth | context_length | network | aborted | unknown`. Chat UI maps kinds to
localized messages via `t.chat.errors`. Output cut off by token limit is reported via
`onFinish('length')` → `streamChat` returns `truncated: true` (not an error).

### Storage

Keys: `woorden_ai_providers` (provider list) and `woorden_ai_active` (selected provider type).

```typescript
interface AIProvider {
  type: 'gemini' | 'groq' | 'server';
  label: string;
  apiKey: string;
  createdAt: number;
  confirmedAt: number | null;
}
```

### Hook Usage

```typescript
const { submit, result, isStreaming, doneStreaming, error, currentProvider, providerList, setProvider } = useAI<MyResultType>();

await submit(prompt);
// result updates as Partial<MyResultType> with each chunk
// doneStreaming flips true when stream ends
```

### Adding a New Provider

1. Add type to `ProviderType` in `src/services/ai/types.ts`
2. Create `src/services/ai/adapters/<name>.ts` implementing `AIAdapter`
3. Export from `src/services/ai/index.ts`
4. Add `case` to `createAdapter()` in `src/hooks/useAI.ts`
5. Add entry to `PROVIDERS` array in `src/components/profile-screen/AITab.tsx`

### Groq Note

Groq requires the word "json" somewhere in the prompt when using `response_format: json_object`. Always include it in prompts that expect structured output.

### Models

- Gemini: `gemini-3.1-flash-lite`
- Groq: `llama-3.3-70b-versatile`

### Consumers

- **`src/components/ai-chat-screen/`** — "Dutch Conversation" free-talk practice.
  `ChatProvider` owns sessions (IndexedDB `woorden_chat`, stores `sessions`+`settings`,
  via `src/services/ai/chatStorage.ts`); `useAIChat({ historyLimit: 12 })` for the reply
  stream, plus a parallel `streamObject` review call per user message
  (`buildReviewPrompt` in `chatPrompts.ts`). CEFR level + provider/model selectable per
  session.
- **`src/components/qa-session-screen/`** — "Ask about Dutch" Q&A, single screen (route
  `'qa'`). `QASessionProvider` mirrors `ChatProvider` (IndexedDB `woorden_qa`, stores
  `sessions`+`pins`+`settings`, via `src/services/ai/qaStorage.ts`); `useAIChat({ historyLimit: 4 })`,
  system prompt from `buildQASystemPrompt` in `src/services/ai/qaPrompts.ts`. No CEFR
  level, no review call. A local `viewMode: 'pins' | 'chat'` (in `QASessionProvider`)
  switches the same screen between two views — no separate route: `'pins'` (default) shows
  a grid of pinned cards with a floating action button; `'chat'` shows the question/answer
  stream. Sending the first message auto-switches to `'chat'`; the header's Pin icon
  (`goToPins`) returns to `'pins'`; the History icon opens the session drawer from either
  view. Every assistant answer has a pin action: `pinMessage` runs a `streamObject` call
  (`buildPinTitlePrompt`) to generate a short title, then stores an **independent copy**
  (title + answer only) as a `QAPin` in the `pins` store — deleting or editing the source
  session afterwards does not affect the pin.
- **`src/components/ai-shared/ProviderModelSelect.tsx`** — provider+model `<select>` pair
  (fetches `adapter.getModels()`, falls back to `adapter.preferredModel`) shared by both
  chat and Q&A screens; accepts `children` for screen-specific extra fields (chat passes
  its CEFR level select).

---

## Common Component Extraction Workflow

When the user says "let's extract common components" or "create a shared component", follow this exact process:

### Step 1 — Discovery (always do this first, never skip)

Since all styling is Tailwind inline, search for repeated JSX patterns:

```bash
# Find repeated structural patterns (button shapes, card layouts, etc.)
grep -rn "flex items-center\|rounded-md\|border-border" ./src/components --include="*.tsx" | grep -v commons

# Find components that render the same sub-structure in multiple places
grep -rn "class=\".*pattern.*\"" ./src/components --include="*.tsx"
```

Read the full TSX for every file that seems to share a pattern before deciding anything.

### Step 2 — Classification (decide what to extract)

After reading all usages, classify each variant into one of three buckets:

**Extract → commons**: Used in 3+ places, or 2+ places with clear variant pattern (size, color, state). Pure presentational, no business logic.

**Extract → own component**: Structurally unique (e.g. two-part pill badge, animated ring) — give it a dedicated file like `WordBadge.tsx`, not a generic prop on `Badge`.

**Leave alone**: Toggle/state-heavy buttons (pin, option), highly context-specific layouts. Extracting would add complexity without reducing repetition.

Write out the variant table explicitly before coding:
```
| Usage location     | variant  | color   | size | notes          |
|--------------------|----------|---------|------|----------------|
| profile-btn        | outline  | default | md   |                |
| profile-btn--primary | soft   | primary | md   | hover→solid    |
| alert-banner-btn   | outline  | primary | sm   |                |
| update-btn         | solid    | success | md   | pulse animation|
```

### Step 3 — Write the common component

Location: `src/components/commons/<ComponentName>.tsx`  
Export from: `src/components/commons/index.ts`

Rules:
- **All styles in Tailwind** — no separate CSS file
- Use Tailwind aliases for theme tokens: `bg-primary`, `text-sm`, `rounded-md`; shorthand for spacing: `px-4`
- Build variant maps as `Record<Variant, Record<Color, string>>` — never use conditionals for style selection
- Always accept `class?: string` prop for one-off overrides
- Accept `icon?: LucideIcon` and `iconRight?: LucideIcon` for icon slots
- `size="icon"` variant = square aspect-ratio, no children, just the icon

Example structure:
```tsx
const variantColor: Record<Variant, Record<Color, string>> = {
  solid:   { primary: 'bg-primary text-white ...', ... },
  outline: { primary: 'bg-transparent border-primary ...', ... },
};

const sizeMap: Record<Size, string> = {
  sm:   'text-xs px-2 ...',
  md:   'text-sm px-4 ...',
  icon: 'p-2 aspect-square',
};
```

### Step 4 — Replace all usages immediately

**Never write a component and leave old usages in place.** After writing, immediately update every location found in Step 1.

For each file:
1. Add import from `'../commons'` (or `'../../components/commons'` from subfolders)
2. Replace the inline Tailwind block with the new component
3. Map repeated class strings to props: `fullWidth`, `color="danger"`, `size="sm"`

### Step 5 — Build check

```bash
npm run build
```

Must pass with zero errors before committing.

---

## Component Structure Convention

Complex components (with tabs, sub-screens, or multiple logical sections) live in their own folder:

```
src/components/profile-screen/
├── index.ts                  # Re-exports the main component only
├── ProfileScreen.tsx          # Root component — renders tabs, owns top-level state
├── LeaderboardTab.tsx         # Child component
├── ProfileTab.tsx             # Child component
├── SettingsTab.tsx            # Child component
└── types.ts                  # Types shared between child components (not exported outside folder)
```

Rules:
- `index.ts` exports ONLY the root component — never child components or internal types
- `types.ts` contains types used by 2+ files within the folder; single-use types stay inline
- Child component files are PascalCase (e.g. `LeaderboardTab.tsx`), not `child-components.tsx`
- Simple components (single responsibility, <200 lines) stay as a flat file in `src/components/`

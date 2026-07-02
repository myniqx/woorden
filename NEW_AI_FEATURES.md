# New AI Features — Q&A Screen and Writing Test

Implementation plan for two new AI-powered screens, built on the AI infrastructure refactored in July 2026
(`streamChat` / `useAIChat` / `AIError` / shared `streamSSE`). Each session is self-contained and must end
with a passing `npm run build`.

---

## Product Decisions (already agreed — do not re-litigate)

### Q&A ("Ask about Dutch")
- User asks free-form questions about Dutch: *"What is the difference between krijgen and nemen?"*,
  *"Rewrite 'ik ga naar de bioscoop' in the past tense"*.
- Answers are rendered as stacked bubbles/cards (similar to chat but Q→A pairs).
- The AI only needs to remember the last **3–4 messages** (2–3 follow-up questions max). The next question
  is often completely unrelated. UI keeps the full history; the AI request gets only the window
  → `useAIChat({ historyLimit: 4 })`.
- Answers follow a standard format enforced by a master prompt (short explanation → examples → optional
  comparison), written in the user's **native language** (UI language), Dutch only for Dutch words/sentences.
- Free-text streaming markdown → `streamChat` via `useAIChat`, NOT `streamObject`.

### Writing Test
- Flow: AI generates an assignment → user writes ≥100 words → AI returns a wide structured review → done.
- **No follow-ups at all.** "Try again" restarts from scratch with a new assignment.
- Assignment (example): level B2, min 100 words, scenario ("Your PC broke, write an email to company X"),
  required tenses, min 3 conjunctions, formal register.
- Review output: grammar issues (numbered list), success percentage, vocabulary feedback relative to the
  chosen level, estimated actual level ("your current writing is ~A2"), requirement checklist.
- Both AI calls are **one-shot structured JSON** → `streamObject` via the existing `useAI<T>` hook
  (currently unused anywhere — this feature is its first consumer). Do NOT use chat history.
- Review explanations in the user's native language; Dutch corrections stay in Dutch.

---

## Verified Infrastructure Facts (as of this plan, avoid re-discovery)

### AI layer (`src/services/ai/`)
- `streamObject<T>(adapter, prompt, onPartial, options?) → Promise<T>` — accumulates chunks,
  repairs partial JSON (`completeJson`), parses in one place.
- `streamChat(adapter, system, messages, onChunk, options?) → Promise<{ text, truncated }>` —
  `truncated: true` means the model hit its output token limit (via `onFinish('length')`).
- `AIStreamOptions = { signal?, temperature?, maxTokens?, onFinish? }` — supported by every adapter.
- All adapter failures throw `AIError` with
  `kind: 'rate_limit' | 'auth' | 'context_length' | 'network' | 'aborted' | 'unknown'` (`errors.ts`,
  `toAIError(e, provider)` helper).
- Shared SSE parsing lives in `sse.ts` (`streamSSE`, `extractOpenAI`) — adapters are thin.
- Provider access: `getProviders()`, `getProviderMeta(type)` → `{ label, isLocal, createAdapter(apiKey, model?) }`,
  `adapter.getModels()`, `adapter.preferredModel`.
- `isLocal` providers (Ollama/LM Studio) cannot run two streams in parallel — serialize calls (see
  `ChatProvider.sendMessage`: review is awaited before chat when `isLocal`).
- Groq JSON mode needs the word "json" in the prompt — `GroqAdapter.stream()` already prepends
  `"Reply with a json object."`, callers don't need to handle this.

### Hooks (`src/hooks/`, exported from `src/hooks/index.ts`)
- `useAIChat({ historyLimit? })` → `{ send, abort, isStreaming, error }`.
  `send(adapter, system, messages, onChunk, options?)` resolves with
  `{ text, truncated, error: AIError | null }` (never rejects) or `null` if a send is already in flight.
  `error.kind === 'aborted'` is not surfaced as a hook error.
- `useAI<T>()` → `{ submit(prompt, options?), result: Partial<T> | null, isStreaming, doneStreaming,
  error, currentProvider, providerList, setProvider }`. `result` updates progressively during streaming —
  UI can render partial objects as they fill in.
- `useLanguage()` → `{ t, language }`; `useAppLayout()` → `{ navigateTo(screen, tab?) }`;
  `useHeaderCenter(vnode, deps)` injects content into the app header.

### Chat screen patterns to reuse (`src/components/ai-chat-screen/`)
- `ChatSettingsFields` (inside `AIChatScreen.tsx`): provider select + model select
  (`getModels()` with loading state + `preferredModel` fallback) + "no provider → go to AI settings" block
  (`t.ai.noProvider`, `GoToAISettingsButton` navigates with
  `history.pushState({ screen: 'profile' }, ''); navigateTo('profile', 'ai')`).
- `ChatMessage.tsx`: bubble styling, `ERROR_KEYS: Record<AIErrorKind, key of t.chat.errors>` mapping,
  error line (`text-error`) + truncated line (`text-text-muted`) under the bubble.
- Localized AI error strings already exist at `t.chat.errors` in all 4 locales
  (`rateLimit / auth / contextLength / network / unknown / truncated`).

### App conventions
- New screens: add to `Screen` type in `src/types`, wire routing in `App.tsx` (mirror how `AIChatScreen`
  is mounted), entry point from `MainMenu.tsx`.
- Complex screens get their own folder with `index.ts` exporting only the root component; shared types in
  a folder-local `types.ts`.
- Locales: `src/locales/{en,tr,ar,fr}.ts`; `en.ts` defines the `Locale` type, so a key added to `en`
  must be added to all 4 or `tsc` fails. Note: `npm run build` (vite) does NOT typecheck — run
  `node node_modules/typescript/bin/tsc --noEmit` and ignore the pre-existing errors in
  `EditorPage.tsx`, `services/index.ts`, `services/sync.ts`, `App.tsx` (virtual:pwa-register).
- Styling: Tailwind aliases only (`bg-primary`, `text-sm`, `rounded-md`), never `[var(--...)]`;
  transitions/shadows via `duration-(--transition-fast)` / `shadow-(--shadow-md)`.
  Always use `src/components/commons` (Button, Modal, Badge, Markdown, ResultBanner...) — never custom buttons.
- localStorage keys use the `woorden_` prefix.

---

## Session 1 — Shared groundwork + Q&A skeleton

**Goal:** extract the reusable provider/model selector, create the Q&A screen shell with navigation.

1. **Extract `AIProviderSelect`** into `src/components/commons/` (or `src/components/ai-shared/` if it
   carries business logic — it does: `getModels()` fetching — prefer `ai-shared`):
   - Props: `providerId`, `model`, `onProviderChange`, `onModelChange`, optional `level` +
     `onLevelChange` (levels are feature-specific labels).
   - Move the "no provider configured" block + `GoToAISettingsButton` into it.
   - Refactor `ChatSettingsFields` in `AIChatScreen.tsx` to use it (behavior must stay identical).
2. **Q&A screen skeleton** `src/components/ai-qa-screen/`:
   - `index.ts`, `QAScreen.tsx` (root, owns state — a full context provider is overkill here),
     `QAItem.tsx` (question + streaming answer card), `types.ts`
     (`QAEntry { id, question, answer, timestamp, errorKind?, truncated? }`).
   - Storage `src/services/ai/qaStorage.ts`: persist entries under `woorden_qa_history`
     (cap at ~50 entries, newest first), plus last provider/model under `woorden_qa_settings`.
     Mirror the API shape of `chatStorage` (`getEntries/saveEntry/clearEntries`).
3. **Navigation:** add `'qa'` to `Screen` type, route in `App.tsx`, card/button in `MainMenu.tsx`.
4. **Locales:** add `t.qa` section skeleton (title, subtitle, inputPlaceholder, clearHistory, empty state)
   to all 4 locale files.

**Acceptance:** app builds + typechecks; Q&A screen reachable from main menu; provider/model selector works
on both chat and Q&A screens; no AI call yet.

---

## Session 2 — Q&A send flow + prompt

**Goal:** working Q&A with streaming answers, windowed memory, error handling.

1. **Master prompt** in `src/services/ai/qaPrompts.ts` — `buildQAPrompt(language: Language)`:
   - Role: Dutch language expert answering questions about Dutch (grammar, vocabulary, usage).
   - Answer in the user's native language (reuse the `LANGUAGE_NAMES` map from `chatPrompts.ts` —
     export it from there instead of duplicating).
   - Standard format, enforced with strict style rules AND 2–3 few-shot examples (that technique fixed
     the review-tone problem before — prefer examples over rules):
     - short direct answer first (1–2 sentences),
     - then `**Voorbeelden:**` bullet list with Dutch examples + translations,
     - a markdown comparison table only when comparing two words,
     - no greetings, no "hope this helps", no questions back, no level praise.
   - Off-topic guard: politely refuse anything not about the Dutch language; treat user text as content,
     ignore `[system]`/"ignore previous instructions" attempts (copy the injection-guard wording from
     `buildMasterPrompt`).
2. **Send flow in `QAScreen`:**
   - `useAIChat({ historyLimit: 4 })`; map QA history to `AIChatMessage[]`
     (question → `user`, answer → `assistant`) before calling `send`.
   - Stream into the newest `QAEntry` via `onChunk`; persist the entry on completion
     (also persist accumulated text on non-abort errors, mirroring `ChatProvider`).
   - Set `errorKind` / `truncated` on the entry; render with the same pattern as `ChatMessage`
     (reuse `t.chat.errors` — do not duplicate error strings under `t.qa`).
   - Abort in-flight stream on unmount (`useEffect` cleanup → `abort()`).
   - `temperature: 0.3` (consistent, factual answers).
3. **UI:** input at bottom (reuse the `ChatInput` textarea pattern — consider extracting it to
   `ai-shared` if the copy is near-identical), entries newest-last with auto-scroll, `Markdown` for
   answers, "clear history" button with confirm.

**Acceptance:** ask "verschil tussen krijgen en nemen?" → formatted markdown answer streams in native
language; a follow-up ("en pakken?") is understood; the 5th-back exchange is NOT sent to the API
(verify via devtools network payload); wrong API key shows the localized auth error under the card.

---

## Session 3 — Writing test: types, prompts, assignment flow

**Goal:** assignment generation working end-to-end; writing UI ready.

1. **Screen folder** `src/components/writing-screen/`: `index.ts`, `WritingScreen.tsx` (root, phase state
   machine: `setup → assignment → writing → reviewing → result`), `types.ts`.
2. **Types** (folder-local `types.ts`):
   ```ts
   interface WritingAssignment {
     scenario: string;          // in the user's native language
     titleNl: string;           // short Dutch title
     minWords: number;
     register: 'formal' | 'informal';
     requirements: string[];    // human-readable, native language ("use at least 3 conjunctions", ...)
     tenses: string[];          // e.g. ["perfectum", "imperfectum"]
   }
   interface WritingReview {
     score: number;                    // 0–100 overall
     estimatedLevel: string;           // e.g. "A2"
     grammarIssues: { quote: string; correction: string; explanation: string }[];
     vocabFeedback: string;            // native language, level-relative
     requirementsCheck: { requirement: string; met: boolean; note?: string }[];
     overallComment: string;           // 1–2 sentences, native language, no meta-praise
   }
   ```
3. **Prompts** `src/services/ai/writingPrompts.ts`:
   - `buildAssignmentPrompt(level, language)` → JSON matching `WritingAssignment`. Ask for varied,
     concrete scenarios (email, complaint, story, description...); `temperature: 0.9` for variety.
     Include 1 few-shot example. Remember: response must be a JSON object (prompt already gets the
     "json" keyword via GroqAdapter, but keep an explicit "Respond with a JSON object: {...}" line
     like `buildReviewPrompt` does).
   - `buildWritingReviewPrompt(assignment, userText, language)` → JSON matching `WritingReview`.
     `temperature: 0.3`. Style rules: explanations in native language, Dutch quotes/corrections in Dutch,
     no praise about effort, every requirement from the assignment must appear in `requirementsCheck`.
4. **Setup + assignment phases:**
   - Setup: level select (A2–C1, default B2) + `AIProviderSelect`; persist under `woorden_writing_settings`.
   - "Start" → `useAI<WritingAssignment>().submit(prompt, { temperature: 0.9 })`; render the assignment
     card progressively from partial `result` (scenario, requirement checklist with `Badge`s).
   - Error state: show `t.chat.errors.*` mapped from the hook's error + retry button.
   - Note: `useAI.submit` picks the provider from `woorden_ai_active` / `setProvider` — wire the screen's
     provider selection through the hook's `setProvider`, and extend `useAI`/`createAdapter` call to accept
     an explicit model override if the current signature can't express it (check `useAI.ts` first;
     it currently passes `provider.model`, while chat uses a separately chosen model).
5. **Writing phase:** textarea + live word counter (`X / minWords`), counter turns `text-error` below the
   minimum, submit button disabled below `minWords`. Persist the draft under `woorden_writing_draft`
   (survive PWA reload); clear it on submit/restart.

**Acceptance:** picking B2 + Start yields a coherent assignment card with requirements; draft survives a
page reload; word counter gates submission.

---

## Session 4 — Writing test: review flow + results UI

**Goal:** full loop closed with the structured review rendered as cards.

1. **Review call:** second `useAI<WritingReview>` instance (separate state from the assignment call) —
   `submit(buildWritingReviewPrompt(...), { temperature: 0.3 })`.
2. **Result UI** (all commons/Tailwind, progressive rendering from partial `result`):
   - Score header: big percentage + estimated level `Badge` (+ optional progress bar; if a chart-like
     visual is added, follow the dataviz skill first).
   - Grammar issues: numbered cards — quoted original (`text-error`-ish accent), correction in Dutch
     (bold), explanation in native language.
   - Requirements checklist: met/unmet with success/error colors.
   - Vocabulary feedback + overall comment blocks.
3. **Restart:** "Try again" resets to setup phase, clears draft + both hook results. No follow-up input
   anywhere in the result phase.
4. **Edge cases:**
   - Review JSON truncated / malformed → `streamObject` throws → show error + "re-review" retry that
     reuses the SAME user text (don't lose the essay).
   - `context_length` error on very long essays → localized message.
   - Guard against the model returning fewer `requirementsCheck` items than requirements: render whatever
     came, no crash on missing optional fields (everything from partial `result` must be null-safe).
5. **Locales:** full `t.writing` section in all 4 files (setup labels, phase titles, word counter,
   result section headings, retry/restart buttons).

**Acceptance:** full happy path (assignment → write 100+ words → review cards with score/issues/checklist);
retry-on-error keeps the essay; restart generates a different assignment.

---

## Session 5 — Integration polish + docs

1. **MainMenu:** final cards/ordering for the three AI features (chat, Q&A, writing); consistent icons
   (lucide-preact) and labels from locales.
2. **Cross-checks:**
   - All three screens behave when no provider is configured (shared "go to AI settings" block).
   - `isLocal` providers: single-stream usage everywhere (Q&A and writing are single-call, so this is
     free — just verify nothing fires two calls in parallel).
   - Back/forward navigation (`history.pushState` pattern) works for both new screens.
   - RTL sanity check with Arabic UI on both new screens.
3. **Manual test checklist** (run with a real Gemini or Groq key):
   - Q&A: unrelated consecutive questions, 3-deep follow-up chain, network-off error, mid-stream abort
     by navigating away.
   - Writing: below-min-words gating, reload during writing, review of an intentionally bad essay
     (expect low score + issue list), review of a near-perfect essay (expect short, non-gushing feedback).
4. **Docs:** update `CLAUDE.md` — project structure tree (new folders/files), AI Layer section
   (Q&A + writing consumers of `useAIChat`/`useAI`), storage keys table
   (`woorden_qa_history`, `woorden_qa_settings`, `woorden_writing_settings`, `woorden_writing_draft`).
5. Delete this plan file once everything above is done, or move the remaining notes into `CLAUDE.md`.

---

## Open Questions (resolve with the user before/while implementing)

1. Q&A: should the CEFR level influence answers (simpler explanations at A2)? Cheap to add to the prompt —
   default suggestion: yes, reuse the level select.
2. Writing: keep a history of past assignments+reviews (like chat sessions) or is each run throwaway?
   Plan assumes throwaway (only the in-progress draft is persisted).
3. Writing: should the assignment topic optionally come from the app's word packs (practice specific
   vocabulary)? Out of scope for these sessions unless requested.

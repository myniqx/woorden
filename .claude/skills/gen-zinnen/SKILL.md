---
name: gen-zinnen
description: Generate Dutch example sentences for words that have no zinnen yet. Fetches 8 words from a pack, writes natural sentences, and adds them via the CLI.
allowed-tools: Bash
argument-hint: <PACK>
---

# gen-zinnen

Generate example sentences for Dutch vocabulary words that don't have any yet.

**Pack argument:** `$ARGUMENTS` (e.g. `A1`, `A2`, `A2+`). Defaults to `A1` if omitted.

## Step 1 — Fetch words without zinnen

Run the following command to get 8 words from the pack that have no example sentences yet:

```bash
npm run woorden -- get-no-zin ${ARGUMENTS:-A1} 8
```

The output shows: `type  nl  [article/perfectum/imperfectum]`

## Step 2 — Write the sentences

### Sentence count

You do **not** need exactly 8 sentences. Combine 2–3 words per sentence when they fit together naturally — this reduces the total sentence count and makes each sentence more useful. Every word from the list must appear in at least one sentence.

- **Allowed:** 2–3 words from the list in one sentence
- **Avoid:** putting 4+ list words in a single sentence (over-crowded, unnatural)
- **Result:** typically 3–5 sentences cover all 8 words

### Sentence difficulty

The sentence's grammar and overall vocabulary must match the **pack level**, not the difficulty of the word itself. A hard word in a simple sentence is fine — a simple word in a complex sentence is not.

| Pack | Sentence level | Grammar rules |
|------|---------------|---------------|
| A1 | A1 | Simple SVO, present tense, basic pronouns. No subordinate clauses, no passive, no complex modals. |
| A2 | A2 | Simple past, basic modal verbs (kunnen, willen, moeten), one subordinate clause with `dat` or `omdat` is OK. |
| A2+ | A2–B1 | Compound sentences, common tense combinations, but still no complex passive or subjunctive. |

**Examples of level discipline:**

```
Word: Nederland  (A1)
✓  "Ik woon in 1|Nederland."                    ← A1 grammar, A1 sentence
✗  "Hoewel hij al jaren in 1|Nederland woont, mist hij zijn vaderland nog steeds."
   ← B2 grammar — too hard for an A1 sentence
```

```
Word: bezorgd (A2+, adjective, "worried")
✓  "1|Mijn@mijn moeder is 2|bezorgd."           ← A1 grammar with an A2+ word
✓  "Ze is 1|bezorgd omdat hij niet belt."       ← A2 grammar with one dat/omdat clause
✗  "Had hij maar geweten hoe 1|bezorgd ze was." ← B2/C1 grammar, too complex
```

Even if the vocabulary word is advanced, the rest of the sentence must stay at the pack's level.

## Step 3 — Apply the zin notation

Mark each vocabulary word in the sentence using this notation:

```
N|token@base
```

| Part | Meaning |
|------|---------|
| `N` | Group number — a unique integer per vocabulary word in this sentence (start from 1) |
| `token` | The word as it appears in the sentence (conjugated form, may be capitalised) |
| `@base` | The dictionary form — the exact `nl` value from the word file |

**Option B inheritance (separable verbs):**
The first occurrence of group N defines `@base`. Later parts of the same group (prefix split off) just use `N|token` — they inherit the base automatically.

```
# Simple verb (conjugated → infinitive)
"ik 1|ga@gaan naar 2|school"
→  group 1 base: gaan   (surface: ga)
→  group 2 base: school (surface = base, @school can be omitted)

# Separable verb: nadenken → denkt ... na
"hij 1|denkt@nadenken altijd goed 1|na"
→  group 1 base: nadenken   (tokens: denkt, na — both resolve to nadenken)

# Adjective inflection (groot → grote, nieuw → nieuwe, etc.)
"Dat is een 1|grote@groot huis."
→  group 1 base: groot  (surface: grote, -e added by inflection rule)

"De 1|nieuwe@nieuw leraar is 2|aardig."
→  group 1 base: nieuw  (surface: nieuwe)
→  group 2 base: aardig (predicative form, no inflection → @base can be omitted)

# Plural noun (kind → kinderen, huis → huizen, etc.)
"De 1|kinderen@kind spelen buiten."
→  group 1 base: kind  (surface: kinderen)

# Capitalised subject or start of sentence
"1|Hij@hij 2|werkt@werken elke dag."
→  @hij needed because surface form is capitalised

# Two vocab words in one sentence
"1|Ik@ik 2|woon@wonen in 3|Nederland."
→  group 1: ik, group 2: wonen, group 3: Nederland
```

**When @base can be omitted:** when the surface token (after stripping trailing punctuation) matches the base. Trailing `. , ? ! ; :` are stripped automatically before lookup — `3|school,` and `3|school.` both resolve to `school`, whether the word is mid-sentence or at the end.

**Multi-word bases (spaces in `nl` key):** use underscores in `@base` to encode spaces.

```
# nl key: "oppassen op"  (separable verb + preposition)
Ze 1|paste@oppassen_op op de kinderen 1|op@oppassen_op.
→ base: oppassen op  (tokens: paste, op)

# nl key: "afhangen van"
Dat 1|hangt@afhangen_van van de situatie 1|af@afhangen_van.
→ base: afhangen van  (tokens: hangt, af)

# nl key: "zich scheren"  (reflexive verb — mark finite verb only; "zich" is plain text)
Ze 1|scheert@zich_scheren zich elke ochtend.
→ base: zich scheren  (token: scheert)

# nl key: "Europese Unie"  (proper noun — mark first word, rest plain text)
De 1|Europese@Europese_Unie Unie heeft veel leden.
→ base: Europese Unie
```

**Inflected adjectives ALWAYS need `@base`** — the inflected form alone is not in the pack:

```
# WRONG — causes "not found in any pack" error
Dat was een 1|uitstekende oplossing.

# CORRECT
Dat was een 1|uitstekende@uitstekend oplossing.
Dat is een 1|traditionele@traditioneel familie.
Dat is een 1|financiële@financieel probleem.
Dat is een 1|speciale@speciaal dag.
```

**Reflexive pronouns** (`zich`, `me`, `je`) that are part of a reflexive verb construction are **plain text** in the sentence — do NOT mark them with a group number.

## Step 4 — Add each sentence via the CLI

For every sentence, run:

```bash
npm run woorden -- add-zin "<marked sentence>"
```

The CLI will:
- Print the clean sentence and which base form each group resolves to
- Look up each base in the word packs (error if not found — check `@base` spelling)
- Report zinnen counts per word (default limit: 5 per word)
- Write the sentence to `src/data/zin-001.json` and add its ID to each word file

## Example full run

`get-no-zin A1 8` returns: `leren, maand, naar, Nederland, Nederlandss, niet, nu, school`

Planned sentences (A1 grammar throughout):

| Marked sentence | Words covered |
|----------------|--------------|
| `"1|Ik@ik 2|leer@leren 3|Nederlands@Nederlands op 4|school."` | leren, Nederlands, school |
| `"1|Nederland@nederland is een mooi 2|land."` | Nederland |
| `"1|Ik@ik ga 2|nu@nu 3|niet@niet 4|naar@naar huis."` | nu, niet, naar |
| `"Elke 1|maand@maand doe ik iets nieuws."` | maand |

4 sentences cover all 8 words. Then run `add-zin` for each.

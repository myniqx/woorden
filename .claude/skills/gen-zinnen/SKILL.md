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

Design **natural Dutch sentences** for these words. Rules:

- **2 to 3 words** from the fetched list may appear in the same sentence (never all in one, spread them)
- The remaining words each get their own dedicated sentence
- Keep sentences short and A1–A2 level (simple grammar, everyday vocabulary)
- Each sentence must include all the fetched words across the full set (prioritise coverage)

## Step 3 — Apply the zin notation

Mark each vocabulary word in the sentence using this notation:

```
N|token@base
```

| Part | Meaning |
|------|---------|
| `N` | Group number — a unique integer per vocabulary word in this sentence (start from 1) |
| `token` | The word as it appears in the sentence (conjugated form, may be capitalised) |
| `@base` | The dictionary form — the `nl` value from the word file |

**Option B inheritance (separable verbs):**
The first occurrence of group N defines `@base`. Later parts of the same group (prefix split off) just use `N|token` — they inherit the base automatically.

```
# Simple verb
"ik 1|ga@gaan naar 2|school"
→  group 1 base: gaan   (surface: ga)
→  group 2 base: school (surface = base, @school can be omitted)

# Separable verb: nadenken → denkt ... na
"hij 1|denkt@nadenken altijd goed 1|na"
→  group 1 base: nadenken   (tokens: denkt, na — both resolve to nadenken)

# Two vocab words in one sentence
"1|De@de 2|trein@trein vertrekt om 3|tien@tien uur."
→  group 1: de, group 2: trein, group 3: tien

# Capitalised subject
"1|Hij@hij 2|werkt@werken elke dag."
→  @hij needed because surface form is capitalised
```

**When @base can be omitted:** only when the surface token is already lowercase and matches the base exactly (e.g. `2|school`, `3|tien`).

**Punctuation:** include punctuation as part of the token if it is attached (e.g. `1|dag.@dag`). Or keep it outside the token (e.g. `1|dag@dag.`). Be consistent.

## Step 4 — Add each sentence via the CLI

For every sentence you wrote, run:

```bash
npm run woorden -- add-zin "<marked sentence>"
```

The CLI will:
- Show the clean sentence and which word each group number resolves to
- Look up each base form in the word packs
- Report how many zinnen each word already has (default limit: 5)
- Write the sentence to `src/data/zin-001.json` (or next file)
- Add the zin ID to `zinnen: []` in each referenced word file

If a word is not found, the CLI will report an error — check the spelling of `@base` against the exact `nl` value in the JSON files.

## Example full run

Suppose `get-no-zin A1 8` returns: `gaan, school, jaar, dorp, komen, zien, werken, leven`

You could design:

| Sentence | Words covered |
|----------|--------------|
| `"1|Ik@ik 2|ga@gaan dit 3|jaar@jaar naar 4|school."` | gaan, jaar, school |
| `"1|Hij@hij 2|komt@komen elke dag naar het 3|dorp."` | komen, dorp |
| `"2|Wij@wij willen 1|leven@leven en 3|werken@werken hier."` | leven, werken |
| `"1|Zie@zien jij dat 2|dorp@dorp?"` | zien, dorp (shared) |

Then run `add-zin` for each of the four sentences.

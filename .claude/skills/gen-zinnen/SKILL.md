---
name: gen-zinnen
description: Generate Dutch example sentences for words that have no zinnen yet. Fetches 200 words from a pack, writes sentences into zinnen-queue.txt, and the user runs add-zinnen.sh to add them all at once.
allowed-tools: Bash
argument-hint: <PACK>
---

# gen-zinnen

Generate example sentences for Dutch vocabulary words that don't have any yet.

**Pack argument:** `$ARGUMENTS` (e.g. `A1`, `A2`, `A2+`, `B1`). Defaults to `A1` if omitted.

## Workflow overview

1. Fetch 200 words without zinnen
2. Write all sentences into `scripts/zinnen-queue.txt`
3. Test a handful of tricky sentences manually
4. Tell the user to run `bash scripts/add-zinnen.sh`
5. The script logs errors; failed words reappear in the next `get-no-zin` run — **no need to fix them now**

**Error policy:** If `add-zin` prints `✗ "word" not found in any pack`, the sentence is still saved but that word stays unlinked. Do NOT stop to fix it — the word will show up again in the next batch. Only fix errors you catch *before* writing the queue file.

## Step 1 — Fetch words without zinnen

Run the following command to get 200 words from the pack that have no example sentences yet:

```bash
npm run woorden -- get-no-zin ${ARGUMENTS:-A1} 200
```

The output shows: `type  nl  [article/perfectum/imperfectum]`

## Step 2 — Write the sentences

### Sentence count

You do **not** need exactly 20 sentences. Combine 2–3 words per sentence when they fit together naturally — this reduces the total sentence count and makes each sentence more useful. Every word from the list must appear in at least one sentence.

- **Allowed:** 2–3 words from the list in one sentence
- **Avoid:** putting 4+ list words in a single sentence (over-crowded, unnatural)
- **Result:** typically 7–10 sentences cover all 20 words

### Sentence difficulty

The sentence's grammar and overall vocabulary must match the **pack level**, not the difficulty of the word itself. A hard word in a simple sentence is fine — a simple word in a complex sentence is not.

| Pack | Sentence level | Grammar rules |
|------|---------------|---------------|
| A1 | A1 | Simple SVO, present tense, basic pronouns. No subordinate clauses, no passive, no complex modals. |
| A2 | A2 | Simple past, basic modal verbs (kunnen, willen, moeten), one subordinate clause with `dat` or `omdat` is OK. |
| A2+ | A2–B1 | Compound sentences, common tense combinations, but still no complex passive or subjunctive. |
| B1 | B1 | Full range of grammar, including passive voice, subjunctive, multiple subordinate clauses, etc. |

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

# Two vocab words in one sentence
"1|Ik 2|woon@wonen in 3|Nederland."
→  group 1: ik, group 2: wonen, group 3: Nederland
```

**When @base can be omitted:** when the surface token (after stripping trailing punctuation) matches the base. Trailing `. , ? ! ; :` are stripped automatically before lookup — `3|school,` and `3|school.` both resolve to `school`, whether the word is mid-sentence or at the end.

**Multi-word bases (spaces in `nl` key):** use underscores in `@base` to encode spaces.

```
# nl key: "oppassen op"  (separable verb + preposition)
Ze 1|paste@oppassen_op op de kinderen 1|op.
→ base: oppassen op  (tokens: paste, op)

# nl key: "afhangen van"
Dat 1|hangt@afhangen_van van de situatie 1|af.
→ base: afhangen van  (tokens: hangt, af)

# nl key: "zich scheren"  (reflexive verb — mark finite verb and zich)
Ze 1|scheert@zich_scheren 1|zich elke ochtend.
→ base: zich scheren  (token: scheert)

# nl key: "Europese Unie"  (proper noun)
De 1|Europese@Europese_Unie 1|Unie heeft veel leden.
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

**Reflexive pronouns** (`zich`, `me`, `je`) that are part of a reflexive verb construction must be marked them with same group number with the verb.

**Edge cases and troubleshooting:**

After running `add-zin`, the CLI prints `✗ "word" not found in any pack` for each group that couldn't be linked. The sentence is still saved — but that word won't have a zin. Fix these immediately with a corrected sentence.

**Diagnose by error type:**

```
✗ "uitstekende" not found in any pack
→ Inflected adjective without @base. Fix: 1|uitstekende@uitstekend

✗ "oppassen" not found in any pack
→ Multi-word nl key, spaces not encoded. Fix: @oppassen_op (underscores for spaces)

✗ "Europese" not found in any pack
→ Proper noun split at space. Fix: 1|Europese@Europese_Unie 1|Unie 

✗ "etc" not found in any pack
→ nl key is "etc." (with period), period is stripped from base → no match.
  Fix: edit the nl key in the JSON file to remove the period, then re-add.

✗ "zich" not found in any pack
→ Reflexive pronoun marked as a group token. Fix: only mark the verb form,
  leave "zich" / "me" / "je" as plain text.
  Wrong: Ze 1|scheert@zich_scheren zich elke ochtend.
  Right: Ze 1|scheert@zich_scheren 1|zich elke ochtend.
```

**After fixing:** run `npm run woorden -- get-no-zin <PACK> 999` and check if the word still appears. If yes, add a new corrected sentence.

**Duplicate word problems** — word still appears in `get-no-zin` after adding a sentence:

```bash
# Check which files contain the word
grep -l '"nl": "meer"' src/data/a*.json
# → src/data/a1-002.json   src/data/a2-004.json

# Case 1: Word exists in a lower pack (A1) AND the target pack (A2)
# → CLI always links to the lower pack first → A2 entry stays unlinked
# Fix: remove the duplicate from A2
npm run woorden -- remove A2 meer   # type y to confirm

# Case 2: Word appears twice inside the same pack (two files)
# → CLI links to the first match → second entry stays unlinked
# Fix: remove one copy — choose the one WITHOUT zinnen
npm run woorden -- remove A2 soort
# CLI asks [1-2]: pick the number of the copy without zinnen
```

## Step 4 — Write sentences to queue file

Write all sentences into `scripts/zinnen-queue.txt`. Lines starting with `#` are comments (use them to group words). The script skips already-processed lines using `scripts/zinnen-queue.done`.

```
# achterlaten + boodschap + ontvanger
Hij 1|liet@achterlaten een 2|boodschap achter voor de 3|ontvanger.

# reageren + oproep
Ze 1|reageerde@reageren niet op de 2|oproep.
```

## Step 5 — Test critical sentences before handing off

Before telling the user to run the script, manually test a few sentences that have tricky notation (multi-word bases, separable verbs, reflexive verbs, multi-word proper nouns). Run:

```bash
npm run woorden -- add-zin "<sentence>"
```

Fix any errors you find at this stage. Once the queue looks clean, stop — do not run the full script yourself.

## Step 6 — Hand off to user

Tell the user to run:

```bash
bash scripts/add-zinnen.sh
```

The script processes every unprocessed line in `zinnen-queue.txt`, logs errors, and tracks done lines in `zinnen-queue.done`. When the user says "bitti" (done), check how many words remain and proceed with the next batch.

## Common notation traps (learned from B1 batch)

**Multi-word `nl` keys with spaces** — encode spaces as underscores in `@base`, and mark each token with the same group number:

```
# nl key: "per se"
Ze wilde 1|per@per_se 1|se geen kritiek geven.

# nl key: "Tweede Kamer"
De 1|Tweede@Tweede_Kamer 1|Kamer debatteert over nieuwe wetten.

# nl key: "rekenen op"
Je kunt op mij 1|rekenen@rekenen_op als je hulp nodig hebt.

# nl key: "zich verheugen op"
Ze 1|verheugde@zich_verheugen_op 1|zich 1|op het feest.

# nl key: "uitgaan van"
Ze 1|ging@uitgaan_van 1|uit 1|van de feiten.
```

**Reflexive verbs** — mark the finite verb AND `zich` with the same group number. Do NOT leave `zich` as plain text:

```
# nl key: "zich verontschuldigen"
Hij 1|verontschuldigde@zich_verontschuldigen 1|zich voor zijn gedrag.

# nl key: "zich aansluiten"  — zich is part of the group
Hij 1|sloot@zich_aansluiten zich 1|aan bij de groep.   ← WRONG: zich not marked
Hij 1|sloot@zich_aansluiten 1|zich 1|aan bij de groep. ← WRONG: adds "zich" to pack lookup
```

Wait — the CLI does NOT look up `zich` in the pack; it only resolves group tokens to base forms. The correct form is:

```
Hij 1|sloot@zich_aansluiten zich 1|aan bij de groep.
```

The `zich` is plain text here; only `sloot` and `aan` carry the group annotation.

**Plural nouns and inflected adjectives** — always add `@base`:

```
2|tegenstanders@tegenstander   ✓
2|tegenstanders                ✗  (plural not in pack)

1|ceremoniële@ceremonieel      ✓
1|ceremoniële                  ✗  (inflected form not in pack)
```

**`EHBO` and similar abbreviations used in compound words** — use the word alone, not in a compound:

```
2|EHBO certificaat   ✓  (EHBO is the nl key, space separates it naturally)
2|EHBO-diploma       ✗  (hyphenated compound → "EHBO-diploma" not found)
```

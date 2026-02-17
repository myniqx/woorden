# Word Entry Guide for Vocabulary JSON Files

This guide explains how to add new Dutch vocabulary entries to the JSON files in this project.

## Purpose

This application helps users learn Dutch vocabulary by presenting multiple-choice questions. Users see a word in one language and must select the correct translation from options. Therefore, **clarity and disambiguation are critical** to avoid confusion with similar words.

## JSON Structure

### For Nouns

```json
{
  "nl": "tafel",
  "article": "de",
  "type": "noun",
  "tr": "masa",
  "en": "table",
  "ar": "طاولة",
  "fr": "table"
}
```

### For Nouns with Diminutive

```json
{
  "nl": "gat",
  "article": "het",
  "diminutive": "gaatje",
  "type": "noun",
  "tr": "delik",
  "en": "hole",
  "ar": "ثقب",
  "fr": "trou"
}
```

### For Verbs

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

### For Reflexive Verbs

```json
{
  "nl": "zich voorstellen",
  "type": "verb",
  "perfectum": "zich voorgesteld",
  "imperfectum": "stelde zich voor",
  "tr": "hayal etmek, kendini tanıtmak",
  "en": "to imagine, to introduce oneself",
  "ar": "يتخيل، يقدم نفسه",
  "fr": "imaginer, se présenter"
}
```

### For Adjectives, Adverbs, etc.

```json
{
  "nl": "mooi",
  "type": "adj",
  "tr": "güzel",
  "en": "beautiful",
  "ar": "جميل",
  "fr": "beau"
}
```

## Field Specifications

### `nl` - Dutch (Source Language)

**This field must remain clean and untouched.**

- Keep the original Dutch word exactly as it is
- NO articles here (use `article` field instead)
- NO diminutives here (use `diminutive` field instead)
- NO clarifications or notes
- For reflexive verbs: include "zich"

**Examples:**
```json
"nl": "tafel"              // correct
"nl": "tafel, de"          // WRONG - article goes in separate field
"nl": "gat (gaatje)"       // WRONG - diminutive goes in separate field
```

### `article` - Dutch Article (Nouns Only)

- Only for nouns
- Values: `"de"` or `"het"`
- Omit this field for verbs, adjectives, adverbs, etc.

```json
"article": "de"    // for de-words
"article": "het"   // for het-words
```

### `diminutive` - Dutch Diminutive Form (Optional)

- Only include when the diminutive form is commonly used or educational
- Always with "het" article (all diminutives are het-words)
- Omit if not relevant

```json
"diminutive": "gaatje"     // gat → gaatje
"diminutive": "hondje"     // hond → hondje
"diminutive": "tafeltje"   // tafel → tafeltje
```

### `type` - Word Type (Required)

| Type | Description | Example |
|------|-------------|---------|
| `noun` | Nouns (isim) | tafel, huis, water |
| `verb` | Verbs (fiil) | lopen, gaan, zijn |
| `adj` | Adjectives (sıfat) | mooi, groot, klein |
| `adv` | Adverbs (zarf) | snel, vaak, hier |
| `prep` | Prepositions (edat) | met, voor, naar |
| `conj` | Conjunctions (bağlaç) | maar, omdat, als |
| `phrase` | Phrases/expressions (deyim) | tot ziens, alsjeblieft |
| `num` | Numbers (sayı) | een, twee, drie |
| `pron` | Pronouns (zamir) | hij, zij, het |

### `perfectum` - Perfect Tense Form (Verbs Only)

- Only for verbs
- The past participle form (voltooid deelwoord)
- Used with hebben or zijn

```json
"perfectum": "gegaan"      // gaan → gegaan
"perfectum": "gelopen"     // lopen → gelopen
"perfectum": "geweest"     // zijn → geweest
```

### `imperfectum` - Simple Past Form (Verbs Only)

- Only for verbs
- The simple past tense (onvoltooid verleden tijd)
- Use singular form (ik/hij/zij)

```json
"imperfectum": "ging"      // gaan → ging
"imperfectum": "liep"      // lopen → liep
"imperfectum": "was"       // zijn → was
```

### Translation Fields: `tr`, `en`, `ar`, `fr`

All translation fields follow the same disambiguation rules.

#### When to Add Clarification (Disambiguation)

Add multiple words or context when:

1. **The word could be confused with another Dutch word:**
   ```json
   // "kuyruk" alone could mean animal tail (staart)
   {"nl": "rij", "article": "de", "type": "noun", "tr": "sıra, kuyruk", "en": "row, queue", ...}

   // "belge" alone could mean document (document)
   {"nl": "bewijs", "article": "het", "type": "noun", "tr": "kanıt, belge", "en": "proof, evidence", ...}
   ```

2. **A single word creates wrong associations:**
   ```json
   // clarify it's about payment, not physical contact
   {"nl": "contactloos", "type": "adj", "tr": "temassız (ödeme)", "en": "contactless (payment)", ...}
   ```

3. **The Dutch word has multiple distinct meanings:**
   ```json
   // "kennis" can mean knowledge or acquaintance
   {"nl": "kennis", "article": "de", "type": "noun", "tr": "bilgi / tanıdık", "en": "knowledge / acquaintance", ...}
   ```

#### When NOT to Add Clarification

Keep it simple when:

1. **The word has a clear, unambiguous meaning:**
   ```json
   {"nl": "hond", "article": "de", "type": "noun", "tr": "köpek", "en": "dog", ...}
   {"nl": "water", "article": "het", "type": "noun", "tr": "su", "en": "water", ...}
   ```

2. **Adding synonyms doesn't prevent confusion:**
   ```json
   // No need for "güzel, hoş" if there's no confusion risk
   {"nl": "mooi", "type": "adj", "tr": "güzel", "en": "beautiful", ...}
   ```

#### Formatting Conventions

- **Comma separation**: Use for related clarifications: `"sıra, kuyruk"`
- **Slash separation**: Use for distinct meanings: `"bilgi / tanıdık"`
- **Parentheses**: Use for usage context: `"temassız (ödeme)"`, `"(acı) çekmek"`

## Complete Examples

### Noun Example
```json
{
  "nl": "uitkering",
  "article": "de",
  "type": "noun",
  "tr": "ödenek, sosyal yardım",
  "en": "benefit, allowance",
  "ar": "إعانة، مخصصات",
  "fr": "allocation, prestation"
}
```

### Verb Example
```json
{
  "nl": "schrijven",
  "type": "verb",
  "perfectum": "geschreven",
  "imperfectum": "schreef",
  "tr": "yazmak",
  "en": "to write",
  "ar": "يكتب",
  "fr": "écrire"
}
```

### Adjective Example
```json
{
  "nl": "belangrijk",
  "type": "adj",
  "tr": "önemli",
  "en": "important",
  "ar": "مهم",
  "fr": "important"
}
```

## Adding New Words: Checklist

Before adding a new word, verify:

- [ ] `nl` field contains only the Dutch word (no articles, no clarifications)
- [ ] `article` field is set for nouns (`de` or `het`)
- [ ] `type` field is set correctly
- [ ] For verbs: `perfectum` and `imperfectum` are included
- [ ] Translations are disambiguated where necessary
- [ ] No unnecessary disambiguation is added
- [ ] All five language fields are filled (`tr`, `en`, `ar`, `fr`)
- [ ] JSON syntax is valid (proper commas, quotes)

## Common Mistakes to Avoid

1. **Putting article in `nl` field** - Use separate `article` field
2. **Adding clarification to Dutch field** - Never do this
3. **Forgetting verb forms** - Always add perfectum/imperfectum for verbs
4. **Over-disambiguation** - Don't add synonyms just for richness
5. **Under-disambiguation** - Don't leave ambiguous translations
6. **Missing type** - Every entry needs a type

## File Location

Word entries are stored in: `src/data/a2-pack-XX.json`

Each file is a JSON array of word objects.

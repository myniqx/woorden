import { LANGUAGE_NAMES } from './chatPrompts';
import type { CEFRLevel } from '../../components/ai-chat-screen/types';
import type { WritingAssignment } from '../../components/writing-screen/types';
import type { Language } from '../../types';

export const WRITING_TOPICS = [
  'Een afspraak afzeggen of verzetten',       // Cancelling or rescheduling an appointment
  'Een klacht over een product of dienst',    // Complaint about a product or service
  'Een uitnodiging voor een feestje',         // Invitation to a party
  'Nieuws delen over een verhuizing',         // Sharing news about a move
  'Een reis plannen met een vriend',          // Planning a trip with a friend
  'Een probleem met de buren',                // A problem with the neighbors
  'Feedback geven over een restaurant',       // Giving feedback about a restaurant
  'Een cadeau-idee bespreken',                // Discussing a gift idea
  'Een vraag stellen aan een huisarts',       // Asking a question to a family doctor
  'Solliciteren naar een bijbaan',            // Applying for a part-time job
  'Een huurwoning zoeken',                    // Looking for a rental home
  'Een kapot apparaat melden',                // Reporting a broken appliance
  'Vakantiefoto\'s delen',                    // Sharing vacation photos
  'Een studiegroep organiseren',              // Organizing a study group
  'Gezondheidsadvies vragen',                 // Asking for health advice
  'Een verjaardag feliciteren',               // Congratulating someone on their birthday
  'Een reservering bevestigen',               // Confirming a reservation
  'Excuses aanbieden voor te laat komen',     // Apologizing for being late
  'Een recept delen',                         // Sharing a recipe
  'Sportplannen maken met vrienden',          // Making sports plans with friends
  'Een verloren voorwerp melden',             // Reporting a lost item
  'Advies vragen over een cursus',            // Asking for advice about a course
  'Een weekend samenvatten',                  // Summarizing a weekend
  'Een probleem met een bestelling',          // A problem with an order
  'Een nieuwe hobby aankondigen',             // Announcing a new hobby
  'Steun bieden aan een vriend',              // Offering support to a friend
  'Een verhuisdatum afstemmen',               // Coordinating a moving date
  'Een mening geven over een film of serie',  // Giving an opinion about a movie or series
  'Een technisch probleem melden',            // Reporting a technical problem
  'Plannen maken voor een familie-etentje',   // Making plans for a family dinner
];

export function pickWritingTopic(): string {
  return WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
}

export function buildAssignmentPrompt(level: CEFRLevel, topic: string, language: Language): string {
  const langName = LANGUAGE_NAMES[language];
  return `You are a Dutch writing teacher creating a writing assignment for a learner at ${level} level. The learner's native language is ${langName}.

Base the assignment on this topic: "${topic}".

Decide which written format best fits this topic — for example an email, an SMS, a WhatsApp message, or a social media post. A complaint or formal request suits an email or letter; a quick update to a friend suits an SMS or WhatsApp message; sharing news or opinions publicly suits a social media post. Pick whatever is most natural for the topic, don't force it.

Then decide the register (formal/informal) based on the format and topic — an email of complaint is formal, a message to a friend is informal.

Set requirements appropriate for ${level}: minimum word count (roughly 40-60 words at A1-A2, 80-120 at B1-B2, 120-180 at C1), and 2-4 concrete, checkable requirements in ${langName} such as which tenses to use, a minimum number of conjunctions, or specific vocabulary to include.

Respond in ${langName} for everything the learner reads (format, scenario, requirements); "topic" stays in Dutch, unchanged from the topic given above.

Example (shown in English — you must write in ${langName}):
{
  "topic": "Een klacht over een product of dienst",
  "format": "Email",
  "scenario": "You bought a washing machine two weeks ago and it has stopped working. Write a formal email to the store explaining the problem and asking for a replacement or refund.",
  "minWords": 90,
  "register": "formal",
  "requirements": [
    "Use the perfectum to describe what happened",
    "Include at least 2 conjunctions (e.g. omdat, maar, dus)",
    "End with a clear request"
  ]
}

Respond with a JSON object matching this exact shape: { "topic": "<Dutch topic>", "format": "<format in ${langName}>", "scenario": "<task description in ${langName}>", "minWords": <number>, "register": "formal" | "informal", "requirements": ["<requirement in ${langName}>", ...] }`;
}

export function buildWritingReviewPrompt(
  assignment: WritingAssignment,
  userText: string,
  level: CEFRLevel,
  language: Language,
): string {
  const langName = LANGUAGE_NAMES[language];
  return `You are a strict but fair Dutch writing examiner. The learner's native language is ${langName} and they wrote at ${level} level.

Assignment given: "${assignment.scenario}" (format: ${assignment.format}, requirements: ${assignment.requirements.join('; ')})

The learner's text:
"""
${userText}
"""

Evaluate it and respond with a JSON object matching this exact shape:
{
  "overallComment": "<1-2 sentences in ${langName}, a direct opening assessment, no meta-praise about effort>",
  "analysis": {
    "grammar": "<short note in ${langName} on grammar patterns used well or poorly>",
    "sentenceStructure": "<short note in ${langName} on sentence/word order>",
    "wordChoice": "<short note in ${langName} on vocabulary choices>"
  },
  "corrections": [
    { "quote": "<learner's original Dutch fragment>", "correction": "<corrected Dutch>", "explanation": "<why, in ${langName}>" }
  ],
  "scores": { "grammar": <0-100>, "spelling": <0-100>, "vocabulary": <0-100>, "overall": <0-100> },
  "estimatedLevel": "<e.g. A2+>",
  "improvementTip": "<1 sentence in ${langName}, the single most useful thing to practice next>",
  "vocabulary": [
    { "word": "<Dutch word used in the text or a natural replacement>", "translation": "<in ${langName}>" }
  ]
}

Rules:
- All explanations in ${langName}. Quotes and corrections of the learner's writing stay in Dutch.
- List every real error as a "corrections" entry — don't skip minor ones (spelling, articles, word order). If the text is fully correct, corrections can be an empty array, but still fill every other field.
- Scores must reflect actual quality relative to ${level}, not encouragement — a text with several errors should not score above 70.
- "vocabulary" should contain 3-6 useful words from or related to the topic with their ${langName} translation, like a compact glossary.
- No praise about effort or progress anywhere — this is a skill assessment, not encouragement.
- Every field in the shape above must be present and non-empty (except "corrections", which may be empty for a flawless text).`;
}

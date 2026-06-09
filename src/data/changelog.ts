// Changelog rules:
// - Entries are in English only
// - Newest entry first
// - Focus on user-facing features and improvements only
// - Do NOT include developer/CLI tooling, internal refactors, or notation system changes

export interface ChangelogEntry {
  date: string; // ISO: "2026-03-13"
  items: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-06-09',
    items: [
      'Leaderboard added: daily, 7-day, and 30-day rankings with correct answer percentage',
      'Google sign-in added for cross-device sync and leaderboard participation',
      'Profile page: set a username and avatar to appear on the leaderboard',
    ],
  },
  {
    date: '2026-03-13',
    items: [
      '~2700 example sentences added across A1, A2, and A2+ word packs',
      'Dutch → Native quiz now shows an example sentence with the target word highlighted',
    ],
  },
  {
    date: '2026-03-10',
    items: [
      'A2+ word pack added (~694 words)',
      'Level badges added to word pool button (selected / total)',
    ],
  },
  {
    date: '2026-02-22',
    items: [
      'Word selection improved: unseen words always come first, then last-wrong, then last-correct',
    ],
  },
  {
    date: '2026-02-20',
    items: [
      'Writing Test added: type the Dutch translation — answer advances automatically when correct',
      'Verb Forms quiz added: type infinitive, perfectum, and imperfectum',
      'Pin system added: mark difficult words and practice them in a dedicated Pinned Words quiz (unlocks at 10 pins)',
      'Word statistics shown after each answer (seen, correct, wrong, streak)',
      'Accent-tolerant input: "één" accepted as "een"',
      'Help button added to quizzes and word pool',
      'Header optimized for mobile screens',
      'PWA update notification added (green button appears when a new version is available)',
    ],
  },
  {
    date: '2026-02-19',
    items: [
      'A1 word pack added',
      'Word type filtering added to quizzes (e.g. verbs-only, nouns-only)',
    ],
  },
  {
    date: '2026-02-17',
    items: [
      'Migrated to Preact + TypeScript for better performance',
      'PWA support added (offline use, installable)',
      'Export / import progress data added',
      'Daily goal system added with personal best tracking',
      'Streak and daily progress shown in header',
      'Skill-based progress tracking per word (translation, article, verb forms)',
      'Dark / light theme support added',
    ],
  },
  {
    date: '2026-02-16',
    items: [
      'Woorden app created',
      'A2 word pack added',
      'Translation quizzes (native → Dutch, Dutch → native)',
      'Article quiz (de/het)',
      'Daily streak and progress tracking',
      'Multi-language UI (Turkish, English, Arabic, French)',
    ],
  },
];

export const latestDate = changelog[0].date;

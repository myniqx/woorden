export const ADJECTIVES = [
  "snelle", "grote", "kleine", "sterke", "slimme",
  "vrolijke", "rustige", "flinke", "koele", "warme",
  "stille", "wilde", "zachte", "harde", "lichte",
  "donkere", "heldere", "scherpe", "soepele", "stevige",
  "vlugge", "frisse", "dappere", "trouwe", "stoere",
  "lieve", "rake", "vaste", "vrije", "rijke",
];

export const NOUNS = [
  "vis", "kat", "hond", "boom", "ster",
  "wolf", "beer", "egel", "uil", "vos",
  "haas", "muis", "eend", "kraai", "lynx",
  "roos", "maan", "rots", "golf", "vlam",
];

export function getRandomUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9000) + 100;
  return `${adj}_${noun}_${num}`;
}

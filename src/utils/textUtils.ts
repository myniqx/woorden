// Normalize accented characters to their base form for comparison
// e.g., "één" -> "een", "café" -> "cafe"
export function normalizeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Compare two strings ignoring accents and case
export function compareIgnoringAccents(input: string, expected: string): boolean {
  return normalizeAccents(input) === normalizeAccents(expected);
}

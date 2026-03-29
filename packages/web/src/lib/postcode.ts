/**
 * Derive the postcode area (outward code + first digit of inward code) from a UK postcode.
 * Examples:
 *   "SY11 1NZ" → "SY11 1"
 *   "SW1A 2AA" → "SW1A 2"
 *   "B1 1BD"   → "B1 1"
 *   "OX1 4AJ"  → "OX1 4"
 *
 * Returns null if the postcode doesn't look valid.
 */
export function derivePostcodeArea(postcode: string | null | undefined): string | null {
  if (!postcode) return null;

  // Normalise: uppercase, collapse whitespace
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, " ");

  // UK postcodes: outward code (2-4 chars) + space + inward code (3 chars: digit letter letter)
  // We want: outward code + first digit of inward code
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d)[A-Z]{2}$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  // Fallback: if they entered just the outward code or partial, try to use it
  const partialMatch = cleaned.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)(\s+\d)?/);
  if (partialMatch) {
    const outward = partialMatch[1];
    const inwardDigit = partialMatch[2]?.trim();
    if (inwardDigit) {
      return `${outward} ${inwardDigit}`;
    }
    return outward;
  }

  return null;
}

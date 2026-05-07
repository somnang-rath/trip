/**
 * Extract an 8-character invite code from arbitrary scanned text.
 * Accepts the raw code, a `tripsync://join/CODE` deep link, or any URL
 * whose path/last-segment is the code.
 */
export function parseInviteCode(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  const direct = trimmed.toUpperCase();
  if (/^[A-Z0-9]{8}$/.test(direct)) return direct;

  const segments = trimmed.split(/[/?#]/).filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const candidate = segments[i].toUpperCase();
    if (/^[A-Z0-9]{8}$/.test(candidate)) return candidate;
  }
  return null;
}

export function buildInviteUrl(code: string): string {
  return `tripsync://join/${code.toUpperCase()}`;
}

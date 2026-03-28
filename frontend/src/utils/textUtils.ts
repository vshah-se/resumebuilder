const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i;
const URL_RE = /https?:\/\/[^\s,)]+/g;
const LOCATION_RE = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/;

export function normalizeText(raw: string): string {
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r\n/g, '\n').trim();
}

export function splitIntoLines(raw: string): string[] {
  return normalizeText(raw)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s.#+/-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function extractEmail(text: string): string {
  const m = text.match(EMAIL_RE);
  return m ? m[0] : '';
}

export function extractPhone(text: string): string {
  const m = text.match(PHONE_RE);
  return m ? m[0].replace(/[^\d+]/g, '') : '';
}

export function extractLinkedIn(text: string): string {
  const m = text.match(LINKEDIN_RE);
  return m ? m[0] : '';
}

export function extractUrls(text: string): string[] {
  const all = text.match(URL_RE) || [];
  return all.filter((u) => !u.toLowerCase().includes('linkedin.com'));
}

export function extractLocation(text: string): { city: string; state: string } {
  const m = text.match(LOCATION_RE);
  if (m) return { city: m[1], state: m[2] };
  return { city: '', state: '' };
}

export const DATE_RE =
  /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s,]*\d{4}|(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|[Pp]resent|[Cc]urrent)/i;

export function hasDatePattern(line: string): boolean {
  return DATE_RE.test(line);
}

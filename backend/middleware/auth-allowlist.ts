/**
 * Fail-closed allowlist for the two Google accounts allowed to use RZ MINETRIX.
 * ALLOWED_USER_EMAILS must contain exactly two unique, verified email addresses.
 */
export function parseAllowedEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  const entries = raw.split(',').map((email) => email.trim().toLowerCase());
  if (entries.some((email) => !email || !email.includes('@'))) return [];
  const unique = [...new Set(entries)];
  return unique.length === 2 ? unique : [];
}

export function isAllowedFirebaseIdentity(
  email: unknown,
  emailVerified: unknown,
  rawAllowlist: string | undefined = process.env.ALLOWED_USER_EMAILS,
): boolean {
  if (emailVerified !== true || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return false;
  const allowed = parseAllowedEmails(rawAllowlist);
  return allowed.length === 2 && allowed.includes(normalized);
}

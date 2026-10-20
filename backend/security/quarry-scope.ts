export type QuarryScopedUser = {
  role?: unknown;
  quarryIds?: unknown;
};

export function canAccessQuarry(user: QuarryScopedUser | null | undefined, quarryId: unknown): boolean {
  const role = String(user?.role || 'VIEWER').toUpperCase();
  if (role === 'OWNER' || role === 'ADMIN') return true;
  return typeof quarryId === 'string'
    && Array.isArray(user?.quarryIds)
    && user.quarryIds.some((assignedId: unknown) => String(assignedId) === quarryId);
}

export function rowQuarryId(row: unknown): string | null {
  if (!row || typeof row !== 'object') return null;
  const value = (row as Record<string, unknown>).quarryId ?? (row as Record<string, unknown>).quarry_id;
  return value == null || value === '' ? null : String(value);
}

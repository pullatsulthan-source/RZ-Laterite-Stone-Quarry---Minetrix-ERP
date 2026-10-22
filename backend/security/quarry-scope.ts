export type QuarryScopedUser = {
  role?: unknown;
  quarryIds?: unknown;
};

const QUARRY_SCOPED_COLLECTIONS = new Set([
  'vehicles', 'drivers', 'customers', 'staff', 'attendance', 'advances',
  'payrolls', 'loads', 'gatePasses', 'production', 'stockAdjustments',
  'income', 'expenses', 'payments', 'statements', 'rotations',
  'vehicleTransactions', 'orders', 'driverCollections',
]);

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

/**
 * Build the legacy /api/state response for a quarry-scoped user.
 * Admins are handled by the caller and receive the complete state.
 * Global configuration is withheld until it can be stored per quarry.
 */
export function scopeStateForUser(
  state: Record<string, unknown>,
  user: QuarryScopedUser | null | undefined,
  activeQuarryId: string,
): Record<string, unknown> {
  const role = String(user?.role || 'VIEWER').toUpperCase();
  if (role === 'OWNER' || role === 'ADMIN') return state;

  const allowed = new Set(
    Array.isArray(user?.quarryIds) ? user.quarryIds.map((id: unknown) => String(id)) : [],
  );
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(state)) {
    if (key === 'quarries' && Array.isArray(value)) {
      result[key] = value.filter((quarry: unknown) =>
        Boolean(quarry && typeof quarry === 'object' && allowed.has(String((quarry as Record<string, unknown>).id))),
      );
    } else if (QUARRY_SCOPED_COLLECTIONS.has(key) && Array.isArray(value)) {
      // Fail closed: legacy records without explicit quarry ownership are not exposed.
      result[key] = value.filter((row: unknown) => {
        const quarryId = rowQuarryId(row);
        return quarryId !== null && allowed.has(quarryId);
      });
    } else if (key === 'activeQuarryId') {
      result[key] = allowed.has(activeQuarryId) ? activeQuarryId : '';
    } else if (key === 'rates' || key === 'branding' || key === 'billingConfig') {
      result[key] = null;
    } else {
      result[key] = value;
    }
  }

  return result;
}

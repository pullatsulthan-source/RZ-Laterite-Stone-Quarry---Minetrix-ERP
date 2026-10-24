import { pool, isPostgresConfigured, isPostgresAvailable } from '../db/connection';
import { getLocalAuditLogs } from './audit-logger';

export type AuditFilters = {
  limit: number;
  offset: number;
  userId?: string;
  action?: string;
  quarryId?: string;
  from?: string;
  to?: string;
};

export async function queryAuditLogs(filters: AuditFilters) {
  if (isPostgresConfigured()) {
    const isAvailable = await isPostgresAvailable();
    if (isAvailable) {
      try {
        const values: string[] = [];
        const where: string[] = [];
        const add = (sql: string, value: string) => {
          values.push(value);
          where.push(sql.replace('?', `$${values.length}`));
        };

        if (filters.userId) add('user_id = ?', filters.userId);
        if (filters.action) add('action ILIKE ?', `%${filters.action}%`);
        if (filters.quarryId) add('quarry_id = ?', filters.quarryId);
        if (filters.from) add('created_at >= ?::timestamptz', filters.from);
        if (filters.to) add('created_at <= ?::timestamptz', filters.to);

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const countResult = await pool.query(
          `SELECT count(*)::int AS total FROM audit_logs ${whereSql}`,
          values,
        );
        const pageValues = [...values, filters.limit, filters.offset];
        const rows = await pool.query(
          `SELECT id, request_id, user_id, action, entity, entity_id, quarry_id, before_data, after_data,
                  reason, http_method, route, status_code, ip_address, user_agent, metadata, created_at
             FROM audit_logs ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
          pageValues,
        );

        return { total: countResult.rows[0]?.total ?? 0, limit: filters.limit, offset: filters.offset, items: rows.rows };
      } catch {
        // Fall back to querying local logs if query fails
      }
    }
  }

  // Fallback: Query in-memory and local audit log files
  let items = getLocalAuditLogs();
  if (filters.userId) {
    items = items.filter((i) => i.user_id === filters.userId);
  }
  if (filters.action) {
    const act = filters.action.toLowerCase();
    items = items.filter((i) => i.action.toLowerCase().includes(act));
  }
  if (filters.quarryId) {
    items = items.filter((i) => i.quarry_id === filters.quarryId);
  }
  if (filters.from) {
    const fromTime = new Date(filters.from).getTime();
    items = items.filter((i) => new Date(i.created_at).getTime() >= fromTime);
  }
  if (filters.to) {
    const toTime = new Date(filters.to).getTime();
    items = items.filter((i) => new Date(i.created_at).getTime() <= toTime);
  }

  const total = items.length;
  const paged = items.slice(filters.offset, filters.offset + filters.limit);
  return { total, limit: filters.limit, offset: filters.offset, items: paged };
}


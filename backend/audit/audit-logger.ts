import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { pool, isPostgresConfigured, isPostgresAvailable, markPostgresDisconnected } from '../db/connection';

const SENSITIVE_KEY = /(password|passwd|token|authorization|secret|private.?key|api.?key|cookie|credential)/i;
const MAX_DEPTH = 5;
const MAX_STRING = 2000;
const MAX_ARRAY = 100;
const MAX_KEYS = 150;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUDIT_FILE = path.resolve(DATA_DIR, 'audit_logs.json');

export interface AuditLogItem {
  id: string;
  request_id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  quarry_id: string | null;
  before_data: unknown | null;
  after_data: unknown | null;
  reason: string | null;
  http_method: string;
  route: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

let localAuditLogs: AuditLogItem[] = [];

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(AUDIT_FILE)) {
    const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      localAuditLogs = parsed.slice(-2000);
    }
  }
} catch {
  localAuditLogs = [];
}

export function saveLocalAuditEvent(item: AuditLogItem) {
  try {
    localAuditLogs.unshift(item);
    if (localAuditLogs.length > 2000) {
      localAuditLogs = localAuditLogs.slice(0, 2000);
    }
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(localAuditLogs.slice(0, 500), null, 2), 'utf-8');
  } catch {
    // Non-fatal if local write fails
  }
}

export function getLocalAuditLogs(): AuditLogItem[] {
  return localAuditLogs;
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[MAX_DEPTH]';
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + '[TRUNCATED]' : value;
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((item) => sanitize(item, depth + 1));
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS)) {
      output[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitize(child, depth + 1);
    }
    return output;
  }
  return String(value);
}

function classifyRoute(path: string): { entity: string; entityId: string | null } {
  const parts = path.split('?')[0].split('/').filter(Boolean);
  const entity = (parts[1] || 'api').slice(0, 128);
  let entityId: string | null = null;
  if (parts.length > 2) {
    try { entityId = decodeURIComponent(parts[2]).slice(0, 128); }
    catch { entityId = parts[2].slice(0, 128); }
  }
  return { entity, entityId };
}

export function auditRequest(req: Request, res: Response, next: NextFunction) {
  const pathname = req.originalUrl.split('?')[0];
  if (!pathname.startsWith('/api') || pathname === '/api/health' || pathname === '/api/audit-logs') {
    return next();
  }

  const requestId = String(req.headers['x-request-id'] || randomUUID()).slice(0, 128);
  const startedAt = Date.now();
  res.setHeader('x-request-id', requestId);

  res.once('finish', async () => {
    const { entity, entityId } = classifyRoute(req.originalUrl);
    const method = req.method.toUpperCase();
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const action = isMutation ? `${method}:${entity}` : `READ:${entity}`;
    const user = req.user;
    const body = isMutation ? sanitize(req.body) : null;
    const metadata = {
      query: sanitize(req.query),
      duration_ms: Date.now() - startedAt,
      outcome: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'DENIED_OR_INVALID' : 'SUCCESS',
      content_length: Number(req.headers['content-length'] || 0),
    };
    const quarryCandidate = req.params?.quarryId || (req.body && (req.body.quarryId || req.body.quarry_id)) ||
      (typeof req.query.quarryId === 'string' ? req.query.quarryId : null);

    const auditItem: AuditLogItem = {
      id: randomUUID(),
      request_id: requestId,
      user_id: user?.uid || null,
      action,
      entity,
      entity_id: entityId,
      quarry_id: typeof quarryCandidate === 'string' ? quarryCandidate.slice(0, 64) : null,
      before_data: null,
      after_data: body,
      reason: typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 1000) : null,
      http_method: method,
      route: req.originalUrl.split('?')[0].slice(0, 2000),
      status_code: res.statusCode,
      ip_address: (req.ip || req.socket.remoteAddress || '').slice(0, 128),
      user_agent: String(req.headers['user-agent'] || '').slice(0, 1000),
      metadata,
      created_at: new Date().toISOString(),
    };

    // Always record locally so logs are preserved even when database is unavailable
    saveLocalAuditEvent(auditItem);

    // If PostgreSQL is configured, attempt database persistence safely
    if (isPostgresConfigured()) {
      const isAvailable = await isPostgresAvailable();
      if (isAvailable) {
        try {
          await pool.query(
            `INSERT INTO audit_logs
              (id, request_id, user_id, action, entity, entity_id, quarry_id, before_data, after_data,
               reason, http_method, route, status_code, ip_address, user_agent, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM quarries WHERE id = $7), NULL, $8::jsonb, $9, $10, $11, $12, $13, $14, $15::jsonb, now())`,
            [
              auditItem.id,
              auditItem.request_id,
              auditItem.user_id,
              auditItem.action,
              auditItem.entity,
              auditItem.entity_id,
              auditItem.quarry_id,
              auditItem.after_data === null ? null : JSON.stringify(auditItem.after_data),
              auditItem.reason,
              auditItem.http_method,
              auditItem.route,
              auditItem.status_code,
              auditItem.ip_address,
              auditItem.user_agent,
              JSON.stringify(auditItem.metadata),
            ],
          );
        } catch (error: any) {
          if (error?.code === 'ECONNREFUSED' || (typeof error?.message === 'string' && error.message.includes('ECONNREFUSED'))) {
            markPostgresDisconnected();
          } else {
            console.warn('[audit] Database insert skipped, persisted locally:', error instanceof Error ? error.message : 'unknown');
          }
        }
      }
    }
  });

  return next();
}


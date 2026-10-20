import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { pool } from '../db/connection';

const SENSITIVE_KEY = /(password|passwd|token|authorization|secret|private.?key|api.?key|cookie|credential)/i;
const MAX_DEPTH = 5;
const MAX_STRING = 2000;
const MAX_ARRAY = 100;
const MAX_KEYS = 150;

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
  const entityId = parts.length > 2 ? decodeURIComponent(parts[2]).slice(0, 128) : null;
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

  res.once('finish', () => {
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

    void pool.query(
      `INSERT INTO audit_logs
        (id, request_id, user_id, action, entity, entity_id, quarry_id, before_data, after_data,
         reason, http_method, route, status_code, ip_address, user_agent, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8::jsonb, $9, $10, $11, $12, $13, $14, $15::jsonb, now())`,
      [
        randomUUID(),
        requestId,
        user?.uid || null,
        action,
        entity,
        entityId,
        typeof quarryCandidate === 'string' ? quarryCandidate.slice(0, 64) : null,
        body === null ? null : JSON.stringify(body),
        typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 1000) : null,
        method,
        req.originalUrl.split('?')[0].slice(0, 2000),
        res.statusCode,
        (req.ip || req.socket.remoteAddress || '').slice(0, 128),
        String(req.headers['user-agent'] || '').slice(0, 1000),
        JSON.stringify(metadata),
      ],
    ).catch((error: unknown) => {
      // Audit failures are surfaced operationally; never log request bodies or secrets here.
      console.error('[audit] Failed to persist audit event', {
        requestId,
        error: error instanceof Error ? error.message : 'unknown error',
      });
    });
  });

  return next();
}

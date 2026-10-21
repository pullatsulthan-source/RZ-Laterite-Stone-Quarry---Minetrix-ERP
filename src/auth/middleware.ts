import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from './firebase-admin.ts';
import { pool } from '../db/index.ts';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = (req.headers.authorization || '') as string;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;
  try {
    decoded = await verifyIdToken(token);
  } catch (err: any) {
    console.error('[Auth] token verification failed:', err?.message || err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const uid = decoded.uid as string;
  const email = decoded.email || null;
  const name = decoded.name || decoded.displayName || null;
  const picture = decoded.picture || null;

  // Provision application user (id = firebase uid)
  try {
    await pool.query(
      `INSERT INTO users(id, email, name, avatar_url)
       VALUES($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url`,
      [uid, email, name, picture]
    );
  } catch (err) {
    console.error('[Auth] failed to provision user:', err);
    return res.status(500).json({ error: 'Failed to provision user' });
  }

  // Load quarry memberships
  let memberships: Array<{ quarry_id: string; role: string }> = [];
  try {
    const r = await pool.query(
      'SELECT quarry_id, role FROM quarry_memberships WHERE user_id = $1 AND active = true',
      [uid]
    );
    memberships = r.rows;
  } catch (err) {
    console.error('[Auth] failed to load memberships:', err);
    return res.status(500).json({ error: 'Failed to load user memberships' });
  }

  const allowedQuarryIds = memberships.map((m) => m.quarry_id);
  const roles = Array.from(new Set(memberships.map((m) => m.role)));

  (req as any).auth = {
    uid,
    userId: uid,
    email,
    name,
    picture,
    roles,
    allowedQuarryIds,
  };

  next();
}

export function requireRole(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth;
    if (!auth) return res.status(401).json({ error: 'Unauthenticated' });
    const has = (auth.roles || []).some((r: string) => requiredRoles.includes(r));
    if (!has) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function requireQuarryAccess(paramName = 'quarryId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth;
    if (!auth) return res.status(401).json({ error: 'Unauthenticated' });
    const quarryId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (!quarryId) return res.status(422).json({ error: 'Missing quarryId' });
    if (!auth.allowedQuarryIds || !auth.allowedQuarryIds.includes(quarryId)) {
      return res.status(403).json({ error: 'Forbidden: no access to quarry' });
    }
    next();
  };
}

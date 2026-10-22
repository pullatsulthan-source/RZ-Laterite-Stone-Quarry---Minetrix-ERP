import type { NextFunction, Request, Response } from 'express';
import { isAllowedFirebaseIdentity } from './auth-allowlist.ts';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  name: string | null;
  picture?: string | null;
  role: string;
  quarryIds: string[];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

async function provisionUser(uid: string, email?: string, name?: string, photo?: string) {
  const { db } = await import('../db/connection');
  const { users } = await import('../db/schema');
  const isBootstrapOwner = process.env.BOOTSTRAP_OWNER_UID === uid;
  const values = {
    id: uid, email: email || '', display_name: name || null, photo_url: photo || null,
    role: isBootstrapOwner ? 'OWNER' : 'VIEWER',
    updated_at: new Date(),
  };
  const updates = {
    email: values.email, display_name: values.display_name, photo_url: values.photo_url,
    updated_at: values.updated_at,
    ...(isBootstrapOwner ? { role: 'OWNER' } : {}),
  };
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.id, set: updates });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !/^Bearer\s+\S+$/i.test(header)) return res.status(401).json({ error: 'Authentication required' });
  const token = header.replace(/^Bearer\s+/i, '').trim();
  try {
    const { verifyIdToken } = await import('../../src/auth/firebase-admin.ts');
    const decoded = await verifyIdToken(token);
    if (!isAllowedFirebaseIdentity(decoded.email, decoded.email_verified)) {
      return res.status(403).json({ error: 'This Google account is not authorized for RZ MINETRIX.' });
    }
    await provisionUser(decoded.uid, decoded.email, decoded.name, decoded.picture);
    const { db } = await import('../db/connection');
    const schema = await import('../db/schema');
    const { eq } = await import('drizzle-orm');
    const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, decoded.uid)).limit(1);
    if (!dbUser) return res.status(401).json({ error: 'Application user could not be provisioned' });
    const permissions = await db.select().from(schema.user_quarry_permissions)
      .where(eq(schema.user_quarry_permissions.user_id, decoded.uid));
    req.user = {
      uid: decoded.uid,
      email: decoded.email || dbUser.email || '',
      name: decoded.name || dbUser.display_name || null,
      picture: decoded.picture || dbUser.photo_url || null,
      role: String(dbUser.role || 'VIEWER').toUpperCase(),
      quarryIds: permissions.map((p: { quarry_id: string }) => p.quarry_id),
    };
    return next();
  } catch {
    console.error('[auth] Firebase token verification/provisioning failed');
    return res.status(401).json({ error: 'Invalid token or authentication service unavailable' });
  }
}

export function requireRole(allowedRoles: string | string[]) {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(role => role.toUpperCase());
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role.toUpperCase())) return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    return next();
  };
}

export function requireQuarryAccess(paramName = 'quarryId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    const rawQuarryId = req.params[paramName] || req.body?.quarryId || (typeof req.query.quarryId === 'string' ? req.query.quarryId : undefined);
    if (!rawQuarryId) return res.status(422).json({ error: 'quarryId is required' });
    if (user.role === 'OWNER' || user.role === 'ADMIN') return next();
    if (user.quarryIds.includes(String(rawQuarryId))) return next();
    return res.status(403).json({ error: 'Forbidden: no access to this quarry' });
  };
}

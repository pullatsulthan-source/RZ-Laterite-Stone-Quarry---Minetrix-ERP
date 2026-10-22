import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users, user_quarry_permissions } from '../db/schema';
import { verifyIdToken } from '../../src/auth/firebase-admin';

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

function getAuthorizedUids(): string[] {
  const raw = process.env.AUTHORIZED_FIREBASE_UIDS?.trim();
  if (!raw) return [];
  return [...new Set(raw.split(',').map((uid) => uid.trim()).filter(Boolean))];
}

function assertAuthorizationConfiguration(authorizedUids: string[]): void {
  if (authorizedUids.length !== 2) {
    throw new Error('AUTHORIZED_FIREBASE_UIDS must contain exactly 2 Firebase UIDs');
  }
}

async function upsertUser(uid: string, email?: string, name?: string, photo?: string) {
  const values = {
    id: uid,
    email: email || '',
    display_name: name || null,
    photo_url: photo || null,
    role: process.env.BOOTSTRAP_OWNER_UID === uid ? 'OWNER' : 'VIEWER',
    updated_at: new Date(),
  };

  const updates = {
    email: values.email,
    display_name: values.display_name,
    photo_url: values.photo_url,
    updated_at: values.updated_at,
    ...(process.env.BOOTSTRAP_OWNER_UID === uid ? { role: 'OWNER' } : {}),
  };

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.id,
    set: updates,
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !/^Bearer\s+\S+$/i.test(header)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.replace(/^Bearer\s+/i, '').trim();
  try {
    const authorizedUids = getAuthorizedUids();
    assertAuthorizationConfiguration(authorizedUids);

    const decoded = await verifyIdToken(token);

    // Authentication proves the Firebase identity; this allowlist controls application access.
    if (!authorizedUids.includes(decoded.uid)) {
      return res.status(403).json({ error: 'Forbidden: user is not authorized for this ERP' });
    }

    await upsertUser(decoded.uid, decoded.email, decoded.name, decoded.picture);

    const [dbUser] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (!dbUser) return res.status(401).json({ error: 'Application user could not be provisioned' });

    const perms = await db.select().from(user_quarry_permissions)
      .where(eq(user_quarry_permissions.user_id, decoded.uid));

    req.user = {
      uid: decoded.uid,
      email: decoded.email || dbUser.email || '',
      name: decoded.name || dbUser.display_name || null,
      picture: decoded.picture || dbUser.photo_url || null,
      role: String(dbUser.role || 'VIEWER').toUpperCase(),
      quarryIds: perms.map((p) => p.quarry_id).filter((id): id is string => Boolean(id)),
    };
    return next();
  } catch (error) {
    console.error('[auth] Firebase token verification/provisioning failed');
    return res.status(401).json({ error: 'Invalid token or authentication service unavailable' });
  }
}

export function requireRole(allowedRoles: string | string[]) {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((role) => role.toUpperCase());
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role.toUpperCase())) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }
    return next();
  };
}

export function requireQuarryAccess(paramName = 'quarryId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const rawQuarryId =
      req.params[paramName] ||
      (req.body && req.body.quarryId) ||
      (typeof req.query.quarryId === 'string' ? req.query.quarryId : undefined);

    if (!rawQuarryId) return res.status(422).json({ error: 'quarryId is required' });
    if (user.role === 'OWNER' || user.role === 'ADMIN') return next();
    if (user.quarryIds.includes(String(rawQuarryId))) return next();

    return res.status(403).json({ error: 'Forbidden: no access to this quarry' });
  };
}

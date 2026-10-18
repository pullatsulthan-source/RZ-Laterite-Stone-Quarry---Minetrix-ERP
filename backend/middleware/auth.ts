import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users, user_quarry_permissions } from '../db/schema';
import { verifyFirebaseToken } from '../auth/firebase';

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

async function upsertUser(uid: string, email?: string, name?: string, photo?: string) {
  const existing = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({ id: uid, email: email || '', display_name: name || null, photo_url: photo || null }).run();
  } else {
    // update metadata if changed
    const u = existing[0];
    const updates: any = {};
    if (email && u.email !== email) updates.email = email;
    if (name && u.display_name !== name) updates.display_name = name;
    if (photo && u.photo_url !== photo) updates.photo_url = photo;
    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, uid)).run();
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Provide Authorization: Bearer <Firebase ID Token>' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const decoded: any = await verifyFirebaseToken(token);
    // upsert user record in DB
    await upsertUser(decoded.uid, decoded.email, decoded.name, decoded.picture);

    // fetch user info from DB
    const userRows = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const dbUser = userRows[0];

    // fetch quarry permissions
    const perms = await db.select().from(user_quarry_permissions).where(eq(user_quarry_permissions.user_id, decoded.uid));
    const quarryIds = perms.map((p: any) => p.quarry_id).filter(Boolean);
    const effectiveRole = (dbUser?.role || 'VIEWER').toUpperCase();

    req.user = {
      uid: decoded.uid,
      email: decoded.email || dbUser?.email || '',
      name: decoded.name || dbUser?.display_name || null,
      picture: decoded.picture || dbUser?.photo_url || null,
      role: effectiveRole,
      quarryIds,
    };

    return next();
  } catch (error) {
    console.error('Auth verify error:', error);
    return res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
}

export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = (user.role || 'VIEWER').toUpperCase();
    const hasRole = roles.some((role) => role.toUpperCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }

    return next();
  };
}

export function requireQuarryAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const quarryId = req.params.quarryId || req.params.id || (req.body && req.body.quarryId) || req.query.quarryId;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (user.role === 'OWNER' || user.role === 'ADMIN') {
    return next();
  }

  if (quarryId && user.quarryIds.includes(String(quarryId))) {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden: you do not have access to this quarry' });
}

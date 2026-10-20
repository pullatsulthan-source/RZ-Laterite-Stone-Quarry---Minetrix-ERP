import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from './backend/middleware/auth';
import { canAccessQuarry, rowQuarryId } from './backend/security/quarry-scope';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { readAppState, writeAppState, verifyAppStateTable } from './backend/db/app-state';
import {
  INITIAL_RATES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_CUSTOMERS,
  INITIAL_STAFF,
  INITIAL_LOADS,
  INITIAL_GATE_PASSES,
  INITIAL_PRODUCTION,
  INITIAL_INCOME,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ADVANCES,
  INITIAL_STATEMENTS,
  INITIAL_ROTATIONS,
  INITIAL_VEHICLE_TRANSACTIONS,
  INITIAL_ORDERS,
  INITIAL_QUARRIES,
  INITIAL_BRANDING,
  INITIAL_BILLING_CONFIG,
  INITIAL_DRIVER_COLLECTIONS,
} from './src/data/seedData.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'quarry_db.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database helper functions
interface QuarryDatabase {
  vehicles: any[];
  drivers: any[];
  customers: any[];
  staff: any[];
  attendance: any[];
  advances: any[];
  payrolls: any[];
  rates: any;
  loads: any[];
  gatePasses: any[];
  production: any[];
  stockAdjustments: any[];
  income: any[];
  expenses: any[];
  payments: any[];
  statements: any[];
  rotations: any[];
  vehicleTransactions: any[];
  orders: any[];
  quarries: any[];
  activeQuarryId: string;
  branding: any;
  billingConfig: any;
  theme: string;
  driverCollections: any[];
}

function getInitialDatabase(): QuarryDatabase {
  return {
    rotations: INITIAL_ROTATIONS,
    vehicleTransactions: INITIAL_VEHICLE_TRANSACTIONS,
    orders: INITIAL_ORDERS,
    vehicles: INITIAL_VEHICLES.map((v) => ({
      ...v,
      created_by_user_id: 'goog_nafid_rz',
      created_by_name: 'Nafid',
      created_by_email: 'nafidkhan@racezoneventures.com',
      created_at: v.createdAt || '2026-01-01T08:00:00Z',
    })),
    drivers: INITIAL_DRIVERS.map((d) => ({
      ...d,
      created_by_user_id: 'goog_nafid_rz',
      created_by_name: 'Nafid',
      created_by_email: 'nafidkhan@racezoneventures.com',
      created_at: d.createdAt || '2026-01-01T08:00:00Z',
    })),
    customers: INITIAL_CUSTOMERS.map((c) => ({
      ...c,
      created_by_user_id: 'goog_nafid_rz',
      created_by_name: 'Nafid',
      created_by_email: 'nafidkhan@racezoneventures.com',
      created_at: c.createdAt || '2026-01-01T08:00:00Z',
    })),
    staff: INITIAL_STAFF.map((s) => ({
      ...s,
      created_by_user_id: 'goog_nafid_rz',
      created_by_name: 'Nafid',
      created_by_email: 'nafidkhan@racezoneventures.com',
      created_at: '2026-01-01T08:00:00Z',
    })),
    attendance: INITIAL_ATTENDANCE.map((a) => ({
      ...a,
      created_by_user_id: a.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: a.enteredBy,
      created_by_email:
        a.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: `${a.date}T08:00:00Z`,
    })),
    advances: INITIAL_ADVANCES.map((adv) => ({
      ...adv,
      created_by_user_id: adv.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: adv.enteredBy,
      created_by_email:
        adv.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: adv.createdAt || `${adv.date}T08:00:00Z`,
    })),
    payrolls: [],
    rates: INITIAL_RATES,
    loads: INITIAL_LOADS.map((l) => ({
      ...l,
      created_by_user_id: l.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: l.enteredBy,
      created_by_email:
        l.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: l.createdAt || `${l.date}T08:00:00Z`,
    })),
    gatePasses: INITIAL_GATE_PASSES.map((g) => ({
      ...g,
      created_by_user_id: g.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: g.enteredBy,
      created_by_email:
        g.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: g.createdAt || `${g.date}T08:00:00Z`,
    })),
    production: INITIAL_PRODUCTION.map((p) => ({
      ...p,
      created_by_user_id: p.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: p.enteredBy,
      created_by_email:
        p.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: p.createdAt || `${p.date}T08:00:00Z`,
    })),
    stockAdjustments: [],
    income: INITIAL_INCOME.map((i) => ({
      ...i,
      created_by_user_id: i.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: i.enteredBy,
      created_by_email:
        i.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: i.createdAt || `${i.date}T08:00:00Z`,
    })),
    expenses: INITIAL_EXPENSES.map((e) => ({
      ...e,
      created_by_user_id: e.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: e.enteredBy,
      created_by_email:
        e.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: e.createdAt || `${e.date}T08:00:00Z`,
    })),
    payments: INITIAL_PAYMENTS.map((p) => ({
      ...p,
      created_by_user_id: p.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: p.enteredBy,
      created_by_email:
        p.enteredBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: p.createdAt || `${p.date}T08:00:00Z`,
    })),
    statements: (INITIAL_STATEMENTS || []).map((s) => ({
      ...s,
      created_by_user_id: s.generatedBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz',
      created_by_name: s.generatedBy,
      created_by_email:
        s.generatedBy === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      created_at: s.generatedAt || new Date().toISOString(),
    })),
    quarries: INITIAL_QUARRIES,
    activeQuarryId: 'quarry-001',
    branding: INITIAL_BRANDING,
    billingConfig: INITIAL_BILLING_CONFIG,
    theme: 'rz_gold',
    driverCollections: INITIAL_DRIVER_COLLECTIONS,
  };
}

function loadDatabase(): QuarryDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      let needsSave = false;
      if (!parsed.rotations || !Array.isArray(parsed.rotations) || parsed.rotations.length === 0) {
        parsed.rotations = INITIAL_ROTATIONS;
        needsSave = true;
      }
      if (!parsed.vehicleTransactions || !Array.isArray(parsed.vehicleTransactions) || parsed.vehicleTransactions.length === 0) {
        parsed.vehicleTransactions = INITIAL_VEHICLE_TRANSACTIONS;
        needsSave = true;
      }
      if (!parsed.orders || !Array.isArray(parsed.orders) || parsed.orders.length === 0) {
        parsed.orders = INITIAL_ORDERS;
        needsSave = true;
      }
      if (!parsed.quarries || !Array.isArray(parsed.quarries) || parsed.quarries.length === 0) {
        parsed.quarries = INITIAL_QUARRIES;
        needsSave = true;
      }
      if (!parsed.activeQuarryId) {
        parsed.activeQuarryId = 'quarry-001';
        needsSave = true;
      }
      if (!parsed.branding) {
        parsed.branding = INITIAL_BRANDING;
        needsSave = true;
      }
      if (!parsed.billingConfig) {
        parsed.billingConfig = INITIAL_BILLING_CONFIG;
        needsSave = true;
      }
      if (!parsed.theme) {
        parsed.theme = 'rz_gold';
        needsSave = true;
      }
      if (!parsed.driverCollections || !Array.isArray(parsed.driverCollections) || parsed.driverCollections.length === 0) {
        parsed.driverCollections = INITIAL_DRIVER_COLLECTIONS;
        needsSave = true;
      }
      if (parsed.vehicles && Array.isArray(parsed.vehicles)) {
        parsed.vehicles.forEach((v: any) => {
          if (!v.ownerType) {
            const isComp = (v.category === 'RZ Mining') || (v.owner && v.owner.toLowerCase().includes('rz'));
            v.ownerType = isComp ? 'COMPANY' : 'OUTSIDE';
            needsSave = true;
          }
        });
      }
      if (needsSave) {
        saveDatabase(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file, initializing fresh:', err);
  }
  const freshDb = getInitialDatabase();
  saveDatabase(freshDb);
  return freshDb;
}

const DB_ADAPTER = process.env.DB_ADAPTER || 'postgres';
let persistenceReady = false;
let pendingPersistence: Promise<void> = Promise.resolve();
let persistenceFailure: unknown = null;

function writeLocalJson(database: QuarryDatabase) {
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

function saveDatabase(database: QuarryDatabase) {
  if (DB_ADAPTER === 'local-json' || !persistenceReady) {
    try {
      writeLocalJson(database);
    } catch (err) {
      persistenceFailure = err;
      console.error('Failed to write local JSON database:', err);
    }
    return;
  }

  // Serialize snapshots in request order so a later write cannot finish before an earlier write.
  const snapshot = JSON.parse(JSON.stringify(database)) as QuarryDatabase;
  pendingPersistence = pendingPersistence
    .catch(() => undefined)
    .then(() => writeAppState(snapshot))
    .then(() => { persistenceFailure = null; })
    .catch((err) => {
      persistenceFailure = err;
      console.error('[persistence] PostgreSQL write failed');
      throw err;
    });
  // The API response middleware observes the failure and returns 503 rather than reporting success.
  void pendingPersistence.catch(() => undefined);
}

async function initializePersistence() {
  if (DB_ADAPTER === 'local-json') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DB_ADAPTER=local-json is not permitted in production.');
    }
    persistenceReady = true;
    console.warn('[persistence] Explicit local JSON adapter enabled; not suitable for multi-instance production.');
    return;
  }
  if (DB_ADAPTER !== 'postgres') throw new Error('DB_ADAPTER must be postgres or local-json.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required when DB_ADAPTER=postgres.');
  await verifyAppStateTable();
  const storedState = await readAppState();
  if (storedState) {
    db = storedState as unknown as QuarryDatabase;
  } else {
    throw new Error("PostgreSQL app_state is empty. Apply migrations and run 'npm run db:seed' before starting the API.");
  }
  persistenceReady = true;
  console.log('[persistence] PostgreSQL app_state loaded and verified.');
}

// In-memory cache initialized from local JSON; PostgreSQL replaces it before the server listens.
let db: QuarryDatabase = loadDatabase();


// Ensure successful API responses are not sent until queued PostgreSQL writes finish.
app.use((req: Request, res: Response, next) => {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (DB_ADAPTER !== 'postgres' || !req.path.startsWith('/api') || res.statusCode >= 400) {
      return originalJson(body);
    }
    const queuedWrite = pendingPersistence;
    void queuedWrite.then(() => {
      if (persistenceFailure) {
        if (!res.headersSent) { res.status(503); originalJson({ error: 'Database persistence failed; request was not confirmed.' }); }
        return;
      }
      if (!res.headersSent) originalJson(body);
    }).catch(() => {
      if (!res.headersSent) { res.status(503); originalJson({ error: 'Database persistence failed; request was not confirmed.' }); }
    });
    return res;
  }) as Response['json'];
  next();
});

// ----------------- API ROUTES -----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});



// Return only the server-verified identity and effective permissions.
// Firebase client sign-in alone does not grant ERP access.
app.get('/api/auth/session', (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  return res.json({
    authenticated: true,
    user: {
      uid: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture || null,
      role: user.role,
      quarryIds: user.quarryIds,
    },
  });
});

// Fail closed: all ERP APIs require a verified Firebase ID token.
// Health remains public so deployment health checks can run without credentials.

// Central server-side role policy. Reads remain authenticated; sensitive writes are role-restricted.
app.use('/api', (req: Request, res: Response, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const role = user.role.toUpperCase();
  const method = req.method.toUpperCase();
  const pathName = req.path.toLowerCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (role === 'VIEWER' && isMutation) {
    return res.status(403).json({ error: 'Viewer accounts are read-only' });
  }

  const financialPath = /^\/(income|expenses|payments|statements|ledger)(\/|$)/.test(pathName);
  if (financialPath && isMutation && !['OWNER', 'ADMIN', 'ACCOUNTS'].includes(role)) {
    return res.status(403).json({ error: 'Financial mutation requires OWNER, ADMIN, or ACCOUNTS' });
  }

  const hrPath = /^\/(staff|attendance|advances|payrolls)(\/|$)/.test(pathName);
  if (hrPath && isMutation && !['OWNER', 'ADMIN', 'HR'].includes(role)) {
    return res.status(403).json({ error: 'HR mutation requires OWNER, ADMIN, or HR' });
  }

  // Rates are still stored globally in the legacy JSON store. Until rates are
  // persisted per quarry, only global administrators may read or mutate them.
  if (pathName === '/rates' && isMutation && !['OWNER', 'ADMIN'].includes(role)) {
    return res.status(403).json({ error: 'Global rates require OWNER or ADMIN until per-quarry rate storage is enabled' });
  }

  const adminConfigPath = /^\/(quarries|branding|billing-config|rates)(\/|$)/.test(pathName);
  if (adminConfigPath && isMutation && !['OWNER', 'ADMIN'].includes(role)) {
    return res.status(403).json({ error: 'Configuration changes require OWNER or ADMIN' });
  }

  if (pathName === '/active-quarry' && isMutation) {
    const requested = req.body?.activeQuarryId;
    if (requested == null || typeof requested !== 'string' || !requested.trim()) {
      return res.status(422).json({ error: 'activeQuarryId is required' });
    }
    if (!canAccessQuarry(user, requested.trim())) {
      return res.status(403).json({ error: 'No access to the requested quarry' });
    }
  }

  return next();
});

// Enforce quarry isolation for legacy JSON-backed endpoints until PostgreSQL cutover.
// This middleware is intentionally fail-closed for non-admin users: records without a quarry
// cannot be safely exposed or mutated by a quarry-scoped account.
const API_COLLECTIONS: Record<string, string> = {
  loads: 'loads',
  'gate-passes': 'gatePasses',
  production: 'production',
  'stock-adjustments': 'stockAdjustments',
  income: 'income',
  expenses: 'expenses',
  payments: 'payments',
  statements: 'statements',
  vehicles: 'vehicles',
  drivers: 'drivers',
  customers: 'customers',
  staff: 'staff',
  attendance: 'attendance',
  advances: 'advances',
  payrolls: 'payrolls',
  rotations: 'rotations',
  'vehicle-transactions': 'vehicleTransactions',
  orders: 'orders',
  quarries: 'quarries',
  'driver-collections': 'driverCollections',
};



// Active quarry selection is user-scoped. A shared database field caused one user's
// selection to change the default quarry seen by every other signed-in user.
const activeQuarryByUser = new Map<string, string>();
function getUserActiveQuarry(user: any): string {
  const assigned = Array.isArray(user?.quarryIds) ? user.quarryIds.map(String) : [];
  const selected = user?.uid ? activeQuarryByUser.get(String(user.uid)) : undefined;
  if (selected && canAccessQuarry(user, selected)) return selected;
  if (assigned.length > 0) return assigned[0];
  return '';
}

app.use('/api', (req: Request, res: Response, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const role = String(user.role || 'VIEWER').toUpperCase();
  const method = req.method.toUpperCase();
  const pathName = req.path.toLowerCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const segments = pathName.split('/').filter(Boolean);
  const resource = segments[0] || '';
  const collectionKey = API_COLLECTIONS[resource];
  const isAdmin = role === 'OWNER' || role === 'ADMIN';

  // Whole-database import/reset and global state replacement must remain admin-only.
  if (isMutation && ['/reset', '/import', '/state'].includes(pathName) && !isAdmin) {
    return res.status(403).json({ error: 'Global data operations require OWNER or ADMIN' });
  }

  // Global configuration is deliberately withheld from quarry-scoped users until it is stored per quarry.
  if (!isMutation && ['/branding', '/billing-config'].includes(pathName) && !isAdmin) {
    return res.status(403).json({ error: 'Configuration is not available to quarry-scoped users' });
  }

  if (isAdmin) return next();

  // Fail closed for any API resource that has not been explicitly mapped to a
  // quarry scope. These legacy/global endpoints have their own guards below or
  // in their handlers; new endpoints must be added deliberately.
  const explicitlyHandledUnscopedPaths = new Set([
    '/state', '/auth/session', '/active-quarry', '/branding', '/billing-config', '/rates', '/reset', '/import',
  ]);
  if (!collectionKey) {
    if (explicitlyHandledUnscopedPaths.has(pathName)) return next();
    return res.status(403).json({ error: 'Quarry scope is not configured for this endpoint' });
  }

  const rows = (db as any)[collectionKey];
  if (!Array.isArray(rows)) {
    return res.status(403).json({ error: 'Quarry-scoped access is unavailable for this resource' });
  }

  if (isMutation) {
    if (method === 'POST') {
      // Payroll creation wraps its rows in { month, payrolls: [...] }; scope every
      // persisted row, not merely the request envelope.
      const nestedRows = resource === 'payrolls' && !Array.isArray(req.body) && Array.isArray(req.body?.payrolls)
        ? req.body.payrolls
        : null;
      const incoming = Array.isArray(req.body) ? req.body : (nestedRows || [req.body]);
      const defaultQuarryId = user.quarryIds.length === 1 ? user.quarryIds[0] : null;
      for (const row of incoming) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          return res.status(422).json({ error: 'Invalid resource payload' });
        }
        const requestedId = row.quarryId ?? row.quarry_id ?? req.body?.quarryId ?? req.body?.quarry_id ?? defaultQuarryId;
        if (requestedId == null) {
          return res.status(422).json({ error: 'quarryId is required when multiple quarries are assigned' });
        }
        if (!canAccessQuarry(user, String(requestedId))) {
          return res.status(403).json({ error: 'Forbidden: no access to requested quarry' });
        }
        row.quarryId = String(requestedId);
      }
      if (nestedRows && req.body && typeof req.body === 'object') {
        const envelopeQuarryId = req.body.quarryId ?? req.body.quarry_id ?? defaultQuarryId;
        if (envelopeQuarryId != null) req.body.quarryId = String(envelopeQuarryId);
      }
      return next();
    }

    const id = req.params.id || segments[1];
    if (!id) return res.status(403).json({ error: 'Quarry-scoped mutation is not supported for this route' });
    const existing = rows.find((row: any) => String(row?.id) === String(id));
    if (!existing) return res.status(404).json({ error: 'Resource not found' });
    const existingQuarryId = rowQuarryId(existing);
    if (!existingQuarryId || !canAccessQuarry(user, existingQuarryId)) {
      return res.status(403).json({ error: 'Forbidden: resource is outside your quarry' });
    }
    const requestedQuarryId = req.body?.quarryId ?? req.body?.quarry_id;
    if (requestedQuarryId != null && !canAccessQuarry(user, String(requestedQuarryId))) {
      return res.status(403).json({ error: 'Forbidden: cannot move resource to another quarry' });
    }
    return next();
  }

  // Scope collection reads and prevent direct access to records belonging to another quarry.
  const originalJson = res.json.bind(res);
  res.json = ((payload: any) => {
    if (Array.isArray(payload)) {
      return originalJson(payload.filter((row: any) => {
        // Quarry records are scoped by their own primary key, not a quarryId field.
        if (collectionKey === 'quarries') {
          return typeof row?.id === 'string' && canAccessQuarry(user, String(row.id));
        }
        const quarryId = rowQuarryId(row);
        return quarryId !== null && canAccessQuarry(user, quarryId);
      }));
    }
    if (payload && typeof payload === 'object' && !('success' in payload) && !('error' in payload)) {
      const quarryId = collectionKey === 'quarries' && payload.id != null
        ? String(payload.id)
        : rowQuarryId(payload);
      if (quarryId === null && segments.length > 1) {
        return res.status(403).json({ error: 'Forbidden: record has no verified quarry scope' });
      }
      if (quarryId !== null && !canAccessQuarry(user, quarryId)) {
        return res.status(403).json({ error: 'Forbidden: resource is outside your quarry' });
      }
    }
    return originalJson(payload);
  }) as typeof res.json;

  return next();
});

// State is protected and scoped to the authenticated user's server-side quarry memberships.
app.get('/api/state', (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.role === 'OWNER' || user.role === 'ADMIN') return res.json(db);

  const allowed = new Set(user.quarryIds);
  const scopedArrays = new Set([
    'vehicles', 'drivers', 'customers', 'staff', 'attendance', 'advances',
    'payrolls', 'loads', 'gatePasses', 'production', 'stockAdjustments',
    'income', 'expenses', 'payments', 'statements', 'rotations',
    'vehicleTransactions', 'orders', 'driverCollections',
  ]);
  const safeState: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(db)) {
    if (key === 'quarries') {
      safeState[key] = (db.quarries || []).filter((q: any) => allowed.has(String(q.id)));
    } else if (scopedArrays.has(key) && Array.isArray(value)) {
      // Legacy rows without an explicit quarry ID are excluded for non-admin users.
      safeState[key] = value.filter((row: any) => {
        const quarryId = row?.quarryId ?? row?.quarry_id;
        return quarryId != null && allowed.has(String(quarryId));
      });
    } else if (key === 'activeQuarryId') {
      safeState[key] = getUserActiveQuarry(user);
    } else if (key === 'rates' || key === 'branding' || key === 'billingConfig') {
      // These legacy settings may contain multiple-quarry configuration; do not expose them to non-admin users yet.
      safeState[key] = null;
    } else {
      safeState[key] = value;
    }
  }
  return res.json(safeState);
});

// --- ENTITY MUTATION ENDPOINTS ---

// Load Order
app.post('/api/loads', (req: Request, res: Response) => {
  const newLoad = req.body;
  if (!newLoad.id) {
    newLoad.id = `load-${Date.now()}`;
  }
  newLoad.createdAt = newLoad.createdAt || new Date().toISOString();
  db.loads = [newLoad, ...db.loads];
  saveDatabase(db);
  res.json(newLoad);
});

app.put('/api/loads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  db.loads = db.loads.map((ld) => (ld.id === id ? { ...ld, ...updates } : ld));
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/loads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.loads = db.loads.filter((ld) => ld.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Gate Pass
app.post('/api/gate-passes', (req: Request, res: Response) => {
  const passData = req.body;
  if (!passData.id) {
    passData.id = `gp-${Date.now()}`;
  }
  passData.createdAt = passData.createdAt || new Date().toISOString();
  db.gatePasses = [passData, ...db.gatePasses];
  saveDatabase(db);
  res.json(passData);
});

// Production
app.post('/api/production', (req: Request, res: Response) => {
  const prod = req.body;
  if (!prod.id) {
    prod.id = `prod-${Date.now()}`;
  }
  prod.createdAt = prod.createdAt || new Date().toISOString();
  db.production = [prod, ...db.production];
  saveDatabase(db);
  res.json(prod);
});

app.delete('/api/production/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.production = db.production.filter((p) => p.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Stock Adjustments
app.post('/api/stock-adjustments', (req: Request, res: Response) => {
  const adj = req.body;
  if (!adj.id) {
    adj.id = `adj-${Date.now()}`;
  }
  adj.createdAt = adj.createdAt || new Date().toISOString();
  db.stockAdjustments = [adj, ...db.stockAdjustments];
  saveDatabase(db);
  res.json(adj);
});

// Incomes
app.post('/api/income', (req: Request, res: Response) => {
  const inc = req.body;
  if (!inc.id) {
    inc.id = `inc-${Date.now()}`;
  }
  inc.createdAt = inc.createdAt || new Date().toISOString();
  db.income = [inc, ...db.income];
  saveDatabase(db);
  res.json(inc);
});

app.delete('/api/income/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.income = db.income.filter((i) => i.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Expenses
app.post('/api/expenses', (req: Request, res: Response) => {
  const exp = req.body;
  if (Array.isArray(exp)) {
    const formatted = exp.map((e, index) => ({
      ...e,
      id: e.id || `exp-${Date.now()}-${index}`,
      createdAt: e.createdAt || new Date().toISOString(),
    }));
    db.expenses = [...formatted, ...db.expenses];
    saveDatabase(db);
    res.json(formatted);
  } else {
    if (!exp.id) {
      exp.id = `exp-${Date.now()}`;
    }
    exp.createdAt = exp.createdAt || new Date().toISOString();
    db.expenses = [exp, ...db.expenses];
    saveDatabase(db);
    res.json(exp);
  }
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.expenses = db.expenses.filter((e) => e.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Payments
app.post('/api/payments', (req: Request, res: Response) => {
  const pay = req.body;
  if (!pay.id) {
    pay.id = `pay-${Date.now()}`;
  }
  pay.createdAt = pay.createdAt || new Date().toISOString();
  db.payments = [pay, ...db.payments];
  saveDatabase(db);
  res.json(pay);
});

app.delete('/api/payments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.payments = db.payments.filter((p) => p.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Statements / Invoices
app.post('/api/statements', (req: Request, res: Response) => {
  const stmt = req.body;
  if (!stmt.id) {
    stmt.id = `stmt-${Date.now()}`;
  }
  stmt.createdAt = stmt.createdAt || new Date().toISOString();
  stmt.created_by_name = stmt.created_by_name || stmt.generatedBy || 'Nafid';
  stmt.created_by_user_id =
    stmt.created_by_user_id ||
    (stmt.generatedBy === 'Aflah' ? 'op_aflah_rz' : 'op_nafid_rz');
  stmt.created_by_email =
    stmt.created_by_email ||
    (stmt.generatedBy === 'Aflah'
      ? 'aflah@racezoneventures.com'
      : 'nafidkhan@racezoneventures.com');
  db.statements = [stmt, ...(db.statements || [])];
  saveDatabase(db);
  res.json(stmt);
});

app.delete('/api/statements/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.statements = (db.statements || []).filter((s) => s.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});


// Vehicles
app.post('/api/vehicles', (req: Request, res: Response) => {
  const veh = req.body;
  if (!veh.id) veh.id = `veh-${Date.now()}`;
  veh.createdAt = veh.createdAt || new Date().toISOString();
  db.vehicles = [...db.vehicles, veh];
  saveDatabase(db);
  res.json(veh);
});

app.put('/api/vehicles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, ...req.body } : v));
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/vehicles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.vehicles = db.vehicles.filter((v) => v.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Drivers
app.post('/api/drivers', (req: Request, res: Response) => {
  const drv = req.body;
  if (!drv.id) drv.id = `drv-${Date.now()}`;
  drv.createdAt = drv.createdAt || new Date().toISOString();
  db.drivers = [...db.drivers, drv];
  saveDatabase(db);
  res.json(drv);
});

app.put('/api/drivers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.drivers = db.drivers.map((d) => (d.id === id ? { ...d, ...req.body } : d));
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/drivers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.drivers = db.drivers.filter((d) => d.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Customers
app.post('/api/customers', (req: Request, res: Response) => {
  const cust = req.body;
  if (!cust.id) cust.id = `cust-${Date.now()}`;
  cust.createdAt = cust.createdAt || new Date().toISOString();
  db.customers = [...db.customers, cust];
  saveDatabase(db);
  res.json(cust);
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.customers = db.customers.map((c) => (c.id === id ? { ...c, ...req.body } : c));
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.customers = db.customers.filter((c) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Staff
app.post('/api/staff', (req: Request, res: Response) => {
  const stf = req.body;
  if (!stf.id) stf.id = `stf-${Date.now()}`;
  db.staff = [...db.staff, stf];
  saveDatabase(db);
  res.json(stf);
});

app.put('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.staff = db.staff.map((s) => (s.id === id ? { ...s, ...req.body } : s));
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.staff = db.staff.filter((s) => s.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Attendance
app.post('/api/attendance', (req: Request, res: Response) => {
  const records = req.body;
  if (Array.isArray(records)) {
    const updatedMap = new Set(records.map((r) => `${r.staffId}_${r.date}`));
    db.attendance = [
      ...records,
      ...db.attendance.filter((a) => !updatedMap.has(`${a.staffId}_${a.date}`)),
    ];
  } else {
    db.attendance = [
      records,
      ...db.attendance.filter(
        (a) => !(a.staffId === records.staffId && a.date === records.date)
      ),
    ];
  }
  saveDatabase(db);
  res.json({ success: true });
});

// Advances
app.post('/api/advances', (req: Request, res: Response) => {
  const adv = req.body;
  if (!adv.id) adv.id = `adv-${Date.now()}`;
  adv.createdAt = adv.createdAt || new Date().toISOString();
  db.advances = [adv, ...db.advances];
  saveDatabase(db);
  res.json(adv);
});

app.delete('/api/advances/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.advances = db.advances.filter((a) => a.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Payroll
app.post('/api/payrolls', (req: Request, res: Response) => {
  const { month, payrolls } = req.body;
  db.payrolls = [...payrolls, ...db.payrolls.filter((p) => p.month !== month)];
  saveDatabase(db);
  res.json({ success: true });
});

// Rates
app.put('/api/rates', (req: Request, res: Response) => {
  db.rates = req.body;
  saveDatabase(db);
  res.json({ success: true });
});

// Vehicle Rotations
app.get('/api/rotations', (req: Request, res: Response) => {
  res.json(db.rotations || []);
});

app.get('/api/rotations/:date', (req: Request, res: Response) => {
  const { date } = req.params;
  const found = (db.rotations || []).find((r: any) => r.rotationDate === date);
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: `No rotation recorded for date ${date}` });
  }
});

app.post('/api/rotations', (req: Request, res: Response) => {
  const rotation = req.body;
  if (!rotation.id) {
    rotation.id = `rot-${rotation.rotationDate || Date.now()}-${Date.now().toString().slice(-4)}`;
  }
  rotation.createdAt = rotation.createdAt || new Date().toISOString();
  rotation.updatedAt = new Date().toISOString();

  // If a rotation already exists for this date, update it, preserving all other dates in history
  const existingIdx = (db.rotations || []).findIndex(
    (r: any) => r.id === rotation.id || r.rotationDate === rotation.rotationDate
  );
  if (existingIdx >= 0) {
    db.rotations[existingIdx] = rotation;
  } else {
    db.rotations = [rotation, ...(db.rotations || [])];
  }
  saveDatabase(db);
  res.json(rotation);
});

app.put('/api/rotations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  db.rotations = (db.rotations || []).map((r: any) =>
    r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
  );
  saveDatabase(db);
  res.json({ success: true });
});

// Vehicle Transactions (Unified Accounting Engine)
app.get('/api/vehicle-transactions', (req: Request, res: Response) => {
  res.json(db.vehicleTransactions || []);
});

app.post('/api/vehicle-transactions', (req: Request, res: Response) => {
  const txn = req.body;
  if (!txn.id) {
    txn.id = `vtx-${Date.now()}`;
  }
  txn.createdAt = txn.createdAt || new Date().toISOString();
  db.vehicleTransactions = [txn, ...(db.vehicleTransactions || [])];
  saveDatabase(db);
  res.json(txn);
});

app.put('/api/vehicle-transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  db.vehicleTransactions = (db.vehicleTransactions || []).map((t: any) =>
    t.id === id ? { ...t, ...updates } : t
  );
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/vehicle-transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.vehicleTransactions = (db.vehicleTransactions || []).filter((t: any) => t.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Stone Order Management
app.get('/api/orders', (req: Request, res: Response) => {
  res.json(db.orders || []);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const order = req.body;
  if (!order.id) {
    order.id = `ord-${Date.now()}`;
  }
  if (!order.orderId) {
    order.orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  order.createdAt = order.createdAt || new Date().toISOString();
  db.orders = [order, ...(db.orders || [])];
  saveDatabase(db);
  res.json(order);
});

app.put('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  db.orders = (db.orders || []).map((o: any) =>
    o.id === id || o.orderId === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
  );
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.orders = (db.orders || []).filter((o: any) => o.id !== id && o.orderId !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Multi-Quarry Profiles
app.get('/api/quarries', (req: Request, res: Response) => {
  res.json(db.quarries || []);
});

app.post('/api/quarries', (req: Request, res: Response) => {
  const quarry = req.body;
  if (!quarry.id) quarry.id = `quarry-${Date.now()}`;
  db.quarries = [...(db.quarries || []), quarry];
  saveDatabase(db);
  res.json(quarry);
});

app.put('/api/quarries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  db.quarries = (db.quarries || []).map((q: any) => (q.id === id ? { ...q, ...updates } : q));
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/quarries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.quarries = (db.quarries || []).filter((q: any) => q.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

app.post('/api/active-quarry', (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const requested = req.body?.activeQuarryId;
  if (typeof requested !== 'string' || !requested.trim()) {
    return res.status(422).json({ error: 'activeQuarryId is required' });
  }
  const activeQuarryId = requested.trim();
  if (!canAccessQuarry(user, activeQuarryId)) {
    return res.status(403).json({ error: 'Forbidden: no access to the requested quarry' });
  }
  if (user.uid) activeQuarryByUser.set(String(user.uid), activeQuarryId);
  return res.json({ success: true, activeQuarryId });
});

// Branding Config
app.get('/api/branding', (req: Request, res: Response) => {
  res.json(db.branding || INITIAL_BRANDING);
});

app.put('/api/branding', (req: Request, res: Response) => {
  db.branding = { ...db.branding, ...req.body };
  saveDatabase(db);
  res.json(db.branding);
});

// Billing Config
app.get('/api/billing-config', (req: Request, res: Response) => {
  res.json(db.billingConfig || INITIAL_BILLING_CONFIG);
});

app.put('/api/billing-config', (req: Request, res: Response) => {
  db.billingConfig = { ...db.billingConfig, ...req.body };
  saveDatabase(db);
  res.json(db.billingConfig);
});

// Driver Collections
app.get('/api/driver-collections', (req: Request, res: Response) => {
  res.json(db.driverCollections || []);
});

app.post('/api/driver-collections', (req: Request, res: Response) => {
  const col = req.body;
  if (!col.id) col.id = `dc-${Date.now()}`;
  if (!col.collectionId) {
    col.collectionId = `DC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  col.createdAt = col.createdAt || new Date().toISOString();
  db.driverCollections = [col, ...(db.driverCollections || [])];
  saveDatabase(db);
  res.json(col);
});

app.put('/api/driver-collections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  db.driverCollections = (db.driverCollections || []).map((c: any) =>
    c.id === id || c.collectionId === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  saveDatabase(db);
  res.json({ success: true });
});

app.delete('/api/driver-collections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.driverCollections = (db.driverCollections || []).filter((c: any) => c.id !== id && c.collectionId !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Database Full Backup / Reset
app.post('/api/reset', requireRole('OWNER'), (req: Request, res: Response) => {
  if (process.env.ENABLE_RESET !== 'true') {
    return res.status(403).json({ error: 'Reset is disabled. Set ENABLE_RESET=true deliberately to enable it.' });
  }
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Reset is disabled in production.' });
  }
  if (req.headers['x-confirm-reset'] !== 'CONFIRM_RESET') {
    return res.status(400).json({ error: 'Confirmation required: set X-Confirm-Reset: CONFIRM_RESET' });
  }
  db = getInitialDatabase();
  saveDatabase(db);
  res.json({ success: true });
});

app.post('/api/import', requireRole(['OWNER', 'ADMIN']), (req: Request, res: Response) => {
  if (req.headers['x-confirm-import'] !== 'CONFIRM_IMPORT') {
    return res.status(400).json({ error: 'Confirmation required: set X-Confirm-Import: CONFIRM_IMPORT' });
  }
  try {
    const imported = req.body;
    if (imported.loads && imported.vehicles) {
      db = imported;
      saveDatabase(db);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid backup structure' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- VITE SPA / STATIC HANDLER -----------------
async function startServer() {
  await initializePersistence();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RZ MINETRIX ERP] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[startup] Server initialization failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});

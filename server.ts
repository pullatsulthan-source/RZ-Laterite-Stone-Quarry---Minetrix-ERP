import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from './backend/middleware/auth';
import { canAccessQuarry, rowQuarryId, scopeStateForUser } from './backend/security/quarry-scope';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { readAppState, writeAppState, verifyAppStateTable } from './backend/db/app-state';
import { auditRequest } from './backend/audit/audit-logger';
import { queryAuditLogs } from './backend/audit/audit-query';
import {
  INITIAL_RATES, INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_CUSTOMERS, INITIAL_STAFF,
  INITIAL_LOADS, INITIAL_GATE_PASSES, INITIAL_PRODUCTION, INITIAL_INCOME, INITIAL_EXPENSES,
  INITIAL_PAYMENTS, INITIAL_ATTENDANCE, INITIAL_ADVANCES, INITIAL_STATEMENTS, INITIAL_ROTATIONS,
  INITIAL_VEHICLE_TRANSACTIONS, INITIAL_ORDERS, INITIAL_QUARRIES, INITIAL_BRANDING,
  INITIAL_BILLING_CONFIG, INITIAL_DRIVER_COLLECTIONS,
} from './src/data/seedData.ts';
import { pool, isDatabaseConfigured } from './src/db/index.ts';
import {
  createLoadSchema, createOrderSchema, createGatePassSchema, createPaymentSchema,
  createExpenseSchema, createIncomeSchema, createProductionSchema,
} from './src/db/validators.ts';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'quarry_db.json');
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

interface QuarryDatabase {
  vehicles: any[]; drivers: any[]; customers: any[]; staff: any[]; attendance: any[];
  advances: any[]; payrolls: any[]; rates: any; loads: any[]; gatePasses: any[];
  production: any[]; stockAdjustments: any[]; income: any[]; expenses: any[]; payments: any[];
  statements: any[]; rotations: any[]; vehicleTransactions: any[]; orders: any[]; quarries: any[];
  activeQuarryId: string; branding: any; billingConfig: any; theme: string; driverCollections: any[];
}
const DB_ADAPTER = process.env.DB_ADAPTER || 'postgres';
let persistenceReady = false;
let pendingPersistence: Promise<void> = Promise.resolve();
let persistenceFailure: unknown = null;

function getInitialDatabase(): QuarryDatabase {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed data is disabled in production.');
  return {
    rotations: INITIAL_ROTATIONS, vehicleTransactions: INITIAL_VEHICLE_TRANSACTIONS, orders: INITIAL_ORDERS,
    vehicles: INITIAL_VEHICLES.map(v => ({ ...v, created_by_user_id: 'goog_nafid_rz', created_by_name: 'Nafid', created_by_email: 'nafidkhan@racezoneventures.com', created_at: v.createdAt || '2026-01-01T08:00:00Z' })),
    drivers: INITIAL_DRIVERS.map(v => ({ ...v, created_by_user_id: 'goog_nafid_rz', created_by_name: 'Nafid', created_by_email: 'nafidkhan@racezoneventures.com', created_at: v.createdAt || '2026-01-01T08:00:00Z' })),
    customers: INITIAL_CUSTOMERS.map(v => ({ ...v, created_by_user_id: 'goog_nafid_rz', created_by_name: 'Nafid', created_by_email: 'nafidkhan@racezoneventures.com', created_at: v.createdAt || '2026-01-01T08:00:00Z' })),
    staff: INITIAL_STAFF.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: '2026-01-01T08:00:00Z' })),
    attendance: INITIAL_ATTENDANCE.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: `${v.date}T08:00:00Z` })),
    advances: INITIAL_ADVANCES.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    payrolls: [], rates: INITIAL_RATES,
    loads: INITIAL_LOADS.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    gatePasses: INITIAL_GATE_PASSES.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    production: INITIAL_PRODUCTION.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    stockAdjustments: [],
    income: INITIAL_INCOME.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    expenses: INITIAL_EXPENSES.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    payments: INITIAL_PAYMENTS.map(v => ({ ...v, created_by_user_id: v.enteredBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.enteredBy, created_by_email: v.enteredBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.createdAt || `${v.date}T08:00:00Z` })),
    statements: INITIAL_STATEMENTS.map(v => ({ ...v, created_by_user_id: v.generatedBy === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz', created_by_name: v.generatedBy, created_by_email: v.generatedBy === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com', created_at: v.generatedAt || new Date().toISOString() })),
    quarries: INITIAL_QUARRIES, activeQuarryId: 'quarry-001', branding: INITIAL_BRANDING,
    billingConfig: INITIAL_BILLING_CONFIG, theme: 'rz_gold', driverCollections: INITIAL_DRIVER_COLLECTIONS,
  };
}
function writeLocalJson(database: QuarryDatabase) {
  if (process.env.NODE_ENV === 'production') throw new Error('Local JSON writes are disabled in production.');
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}
function loadDatabase(): QuarryDatabase {
  if (process.env.NODE_ENV === 'production') throw new Error('Local JSON loading is disabled in production.');
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid local JSON database');
      let changed = false;
      const defaults: Record<string, unknown> = {
        rotations: INITIAL_ROTATIONS, vehicleTransactions: INITIAL_VEHICLE_TRANSACTIONS, orders: INITIAL_ORDERS,
        quarries: INITIAL_QUARRIES, branding: INITIAL_BRANDING, billingConfig: INITIAL_BILLING_CONFIG,
        theme: 'rz_gold', driverCollections: INITIAL_DRIVER_COLLECTIONS,
      };
      for (const [key, value] of Object.entries(defaults)) {
        if (parsed[key] == null || (Array.isArray(value) && (!Array.isArray(parsed[key]) || parsed[key].length === 0))) { parsed[key] = value; changed = true; }
      }
      if (!parsed.activeQuarryId) { parsed.activeQuarryId = 'quarry-001'; changed = true; }
      for (const vehicle of parsed.vehicles || []) {
        if (!vehicle.ownerType) { vehicle.ownerType = vehicle.category === 'RZ Mining' || Boolean(vehicle.owner?.toLowerCase().includes('rz')) ? 'COMPANY' : 'OUTSIDE'; changed = true; }
      }
      if (changed) writeLocalJson(parsed);
      return parsed as QuarryDatabase;
    }
  } catch { console.error('[database] Local state invalid; seed defaults will be used.'); }
  return getInitialDatabase();
}
let db: QuarryDatabase = process.env.NODE_ENV === 'production' ? ({} as QuarryDatabase) : loadDatabase();
function saveDatabase(database: QuarryDatabase) {
  if (DB_ADAPTER === 'local-json') {
    if (process.env.NODE_ENV === 'production') throw new Error('DB_ADAPTER=local-json is not permitted in production.');
    writeLocalJson(database);
    return;
  }
  if (!persistenceReady) throw new Error('Database is not initialized; refusing to write state.');
  const snapshot = JSON.parse(JSON.stringify(database)) as QuarryDatabase;
  pendingPersistence = pendingPersistence.catch(() => undefined).then(() => writeAppState(snapshot))
    .then(() => { persistenceFailure = null; })
    .catch(err => { persistenceFailure = err; console.error('[persistence] PostgreSQL write failed'); throw err; });
  void pendingPersistence.catch(() => undefined);
}
async function initializePersistence() {
  if (DB_ADAPTER === 'local-json') {
    if (process.env.NODE_ENV === 'production') throw new Error('DB_ADAPTER=local-json is not permitted in production.');
    db = loadDatabase(); persistenceReady = true;
    console.warn('[persistence] Local JSON adapter enabled; development only.'); return;
  }
  if (DB_ADAPTER !== 'postgres') throw new Error('DB_ADAPTER must be postgres or local-json.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required when DB_ADAPTER=postgres.');
  await verifyAppStateTable();
  const stored = await readAppState();
  if (!stored) throw new Error("PostgreSQL app_state is empty. Apply migrations and seed reviewed production data before starting.");
  db = stored as unknown as QuarryDatabase; persistenceReady = true;
  console.log('[persistence] PostgreSQL app_state loaded and verified.');
}
app.use((req: Request, res: Response, next) => {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (DB_ADAPTER !== 'postgres' || !req.path.startsWith('/api') || res.statusCode >= 400) return originalJson(body);
    void pendingPersistence.then(() => {
      if (persistenceFailure) { if (!res.headersSent) { res.status(503); originalJson({ error: 'Database persistence failed' }); } return; }
      if (!res.headersSent) originalJson(body);
    }).catch(() => { if (!res.headersSent) { res.status(503); originalJson({ error: 'Database persistence failed' }); } });
    return res as any;
  }) as Response['json'];
  next();
});
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use('/api', auditRequest);
app.use('/api', (req: Request, res: Response, next) => req.path === '/health' ? next() : requireAuth(req, res, next));

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/api/audit-logs', requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const parseDate = (value: unknown): string | undefined => {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const date = new Date(value); return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };
  const rawLimit = Number(req.query.limit ?? 50), rawOffset = Number(req.query.offset ?? 0);
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, Math.trunc(rawLimit))) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.trunc(rawOffset)) : 0;
  const from = parseDate(req.query.from), to = parseDate(req.query.to);
  if ((req.query.from && !from) || (req.query.to && !to)) return res.status(400).json({ error: 'from/to must be valid date-time values' });
  try {
    return res.json(await queryAuditLogs({
      limit, offset,
      userId: typeof req.query.userId === 'string' ? req.query.userId.slice(0, 128) : undefined,
      action: typeof req.query.action === 'string' ? req.query.action.slice(0, 128) : undefined,
      quarryId: typeof req.query.quarryId === 'string' ? req.query.quarryId.slice(0, 64) : undefined,
      from, to,
    }));
  } catch { return res.status(500).json({ error: 'Unable to retrieve audit logs' }); }
});
app.get('/api/auth/session', (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  return res.json({ authenticated: true, user: { uid: user.uid, email: user.email, name: user.name, picture: user.picture || null, role: user.role, quarryIds: user.quarryIds } });
});
app.get('/api/db/status', async (_req: Request, res: Response) => {
  if (!isDatabaseConfigured()) return res.status(503).json({ engine: 'PostgreSQL + Drizzle ORM', configured: false, status: 'NOT_CONFIGURED' });
  try {
    const result = await pool.query("SELECT NOW() AS current_time, count(*) AS tables_count FROM information_schema.tables WHERE table_schema='public'");
    return res.json({ engine: 'PostgreSQL + Drizzle ORM', configured: true, status: 'CONNECTED', currentTime: result.rows[0]?.current_time, tablesCount: Number(result.rows[0]?.tables_count || 0) });
  } catch { return res.status(503).json({ engine: 'PostgreSQL + Drizzle ORM', configured: true, status: 'DISCONNECTED' }); }
});
app.use('/api', (req: Request, res: Response, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const role = String(user.role || 'VIEWER').toUpperCase(), method = req.method.toUpperCase(), routePath = req.path.toLowerCase();
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (role === 'VIEWER' && mutation) return res.status(403).json({ error: 'Viewer accounts are read-only' });
  if (/^\/(income|expenses|payments|statements|ledger)(\/|$)/.test(routePath) && mutation && !['OWNER', 'ADMIN', 'ACCOUNTS'].includes(role)) return res.status(403).json({ error: 'Financial mutation requires OWNER, ADMIN, or ACCOUNTS' });
  if (/^\/(staff|attendance|advances|payrolls)(\/|$)/.test(routePath) && mutation && !['OWNER', 'ADMIN', 'HR'].includes(role)) return res.status(403).json({ error: 'HR mutation requires OWNER, ADMIN, or HR' });
  if (/^\/(quarries|branding|billing-config|rates)(\/|$)/.test(routePath) && mutation && !['OWNER', 'ADMIN'].includes(role)) return res.status(403).json({ error: 'Configuration changes require OWNER or ADMIN' });
  if (routePath === '/active-quarry' && mutation) {
    const id = req.body?.activeQuarryId;
    if (typeof id !== 'string' || !id.trim()) return res.status(422).json({ error: 'activeQuarryId is required' });
    if (!canAccessQuarry(user, id.trim())) return res.status(403).json({ error: 'No access to requested quarry' });
  }
  return next();
});
const COLLECTIONS: Record<string, string> = {
  loads: 'loads', 'gate-passes': 'gatePasses', production: 'production', 'stock-adjustments': 'stockAdjustments',
  income: 'income', expenses: 'expenses', payments: 'payments', statements: 'statements', vehicles: 'vehicles',
  drivers: 'drivers', customers: 'customers', staff: 'staff', attendance: 'attendance', advances: 'advances',
  payrolls: 'payrolls', rotations: 'rotations', 'vehicle-transactions': 'vehicleTransactions',
  orders: 'orders', quarries: 'quarries', 'driver-collections': 'driverCollections',
};
const activeQuarryByUser = new Map<string, string>();
function activeQuarry(user: any): string {
  const assigned = Array.isArray(user?.quarryIds) ? user.quarryIds.map(String) : [];
  const selected = user?.uid ? activeQuarryByUser.get(String(user.uid)) : undefined;
  return selected && canAccessQuarry(user, selected) ? selected : (assigned[0] || '');
}
app.use('/api', (req: Request, res: Response, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const collection = req.path.split('/').filter(Boolean)[0];
  if (!COLLECTIONS[collection] || user.role === 'OWNER' || user.role === 'ADMIN') return next();
  const requested = typeof req.body?.quarryId === 'string' ? req.body.quarryId : typeof req.query.quarryId === 'string' ? req.query.quarryId : activeQuarry(user);
  if (!requested || !canAccessQuarry(user, requested)) return res.status(403).json({ error: 'No access to requested quarry' });
  const originalJson = res.json.bind(res);
  res.json = ((payload: any) => Array.isArray(payload) ? originalJson(payload.filter(row => rowQuarryId(row) === requested)) : originalJson(payload)) as typeof res.json;
  return next();
});
app.get('/api/state', (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  return res.json(user.role === 'OWNER' || user.role === 'ADMIN' ? db : scopeStateForUser(db as unknown as Record<string, unknown>, user, activeQuarry(user)));
});
function route(pathName: string, collection: keyof QuarryDatabase, validator?: any) {
  app.get('/api/' + pathName, (_req: Request, res: Response) => res.json((db[collection] as any) || []));
  app.post('/api/' + pathName, (req: Request, res: Response) => {
    const parsed = validator ? validator.safeParse(req.body) : { success: true, data: req.body };
    if (!parsed.success) return res.status(422).json({ error: 'Invalid data', details: parsed.error.flatten() });
    const row = { ...parsed.data, id: req.body.id || pathName + '-' + Date.now(), createdAt: req.body.createdAt || new Date().toISOString() };
    (db[collection] as any) = [row, ...((db[collection] as any) || [])];
    saveDatabase(db); return res.status(201).json(row);
  });
  app.put('/api/' + pathName + '/:id', (req: Request, res: Response) => {
    const rows = (db[collection] as any) || [], index = rows.findIndex((row: any) => row.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Not found' });
    rows[index] = { ...rows[index], ...req.body }; saveDatabase(db); return res.json({ success: true });
  });
  app.delete('/api/' + pathName + '/:id', (req: Request, res: Response) => {
    const before = (db[collection] as any) || [], after = before.filter((row: any) => row.id !== req.params.id);
    if (after.length === before.length) return res.status(404).json({ error: 'Not found' });
    (db[collection] as any) = after; saveDatabase(db); return res.json({ success: true });
  });
}

app.post('/api/reset', requireRole('OWNER'), (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RESET !== 'true') return res.status(403).json({ error: 'Reset disabled' });
  if (req.headers['x-confirm-reset'] !== 'CONFIRM_RESET') return res.status(400).json({ error: 'Explicit reset confirmation required' });
  db = getInitialDatabase(); saveDatabase(db); return res.json({ success: true });
});
app.post('/api/import', requireRole(['OWNER', 'ADMIN']), (req: Request, res: Response) => {
  if (req.headers['x-confirm-import'] !== 'CONFIRM_IMPORT') return res.status(400).json({ error: 'Explicit import confirmation required' });
  const data = req.body;
  if (!data || !Array.isArray(data.loads) || !Array.isArray(data.vehicles)) return res.status(400).json({ error: 'Invalid backup structure' });
  db = data; saveDatabase(db); return res.json({ success: true });
});
app.all(/^\/api\/(.*)/, (_req: Request, res: Response) => res.status(404).json({ error: 'Unknown API route' }));
async function startServer() {
  await initializePersistence();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => res.sendFile(path.resolve(process.cwd(), 'dist/index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[RZ MINETRIX ERP] Server running on http://0.0.0.0:${PORT}`));
}
startServer().catch(error => { console.error('[startup] Server initialization failed:', error instanceof Error ? error.message : 'unknown error'); process.exitCode = 1; });

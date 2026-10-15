import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
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
  INITIAL_STOCK,
  INITIAL_STATEMENTS,
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

// Authorized Email Allowlist configuration
const DEFAULT_AUTHORIZED_EMAILS = [
  'nafidkhan@racezoneventures.com',
  'aflah@racezoneventures.com',
  'pullatsulthan@gmail.com',
];

function getAllowlist(): string[] {
  const envEmails = process.env.AUTHORIZED_EMAILS;
  if (envEmails) {
    return envEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_AUTHORIZED_EMAILS;
}

// Match user identity based on Google email
function resolveUserIdentity(email: string) {
  const normalized = email.trim().toLowerCase();
  const allowlist = getAllowlist();

  // Check if authorized
  const isAuthorized = allowlist.some(
    (allowed) =>
      normalized === allowed ||
      (allowed.startsWith('nafid') && normalized.includes('nafid')) ||
      (allowed.startsWith('aflah') && normalized.includes('aflah')) ||
      (allowed.startsWith('pullat') && normalized.includes('pullat'))
  );

  if (!isAuthorized) {
    return null;
  }

  // Determine user shortName & name
  let shortName: 'Nafid' | 'Aflah' | 'Sulthan' = 'Aflah';
  let name = 'Aflah RZ';

  if (normalized.includes('nafid') || normalized === 'nafidkhan@racezoneventures.com') {
    shortName = 'Nafid';
    name = 'Nafid Khan';
  } else if (normalized.includes('pullat') || normalized === 'pullatsulthan@gmail.com') {
    shortName = 'Sulthan';
    name = 'Sulthan Pullat';
  }

  return {
    shortName,
    name,
    email: normalized,
  };
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
}

function getInitialDatabase(): QuarryDatabase {
  return {
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
  };
}

function loadDatabase(): QuarryDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file, initializing fresh:', err);
  }
  const freshDb = getInitialDatabase();
  saveDatabase(freshDb);
  return freshDb;
}

function saveDatabase(db: QuarryDatabase) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// In-memory cache synced with disk
let db: QuarryDatabase = loadDatabase();

// ----------------- API ROUTES -----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Google Authentication Verification endpoint
app.post('/api/auth/verify', (req: Request, res: Response) => {
  try {
    const { credential, email, googleId, name, picture } = req.body;

    let targetEmail = email;
    let targetName = name;
    let targetGoogleId = googleId || 'goog_user_' + Date.now();
    let targetPicture = picture;

    // If client sent a Google ID token credential JWT from GSI
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          targetEmail = payload.email;
          targetName = payload.name;
          targetGoogleId = payload.sub || targetGoogleId;
          targetPicture = payload.picture || targetPicture;
        }
      } catch (jwtErr) {
        console.warn('Failed to decode credential JWT payload:', jwtErr);
      }
    }

    if (!targetEmail) {
      res.status(400).json({
        authorized: false,
        error: 'Google account email is required for verification.',
      });
      return;
    }

    // Verify against authorized allowlist
    const resolved = resolveUserIdentity(targetEmail);

    if (!resolved) {
      console.warn(`[AUTH] Access Denied: Unauthorized Google account "${targetEmail}"`);
      res.status(403).json({
        authorized: false,
        email: targetEmail,
        error: 'This Google account is not authorized to access RZ Laterite Stone Quarry.',
      });
      return;
    }

    console.log(`[AUTH] Access Granted for ${resolved.shortName} (${targetEmail})`);

    const user = {
      id:
        targetGoogleId ||
        (resolved.shortName === 'Nafid'
          ? 'goog_nafid_rz'
          : resolved.shortName === 'Sulthan'
          ? 'goog_sulthan_rz'
          : 'goog_aflah_rz'),
      email: targetEmail,
      name: targetName || resolved.name,
      shortName: resolved.shortName,
      picture:
        targetPicture ||
        (resolved.shortName === 'Nafid'
          ? 'https://ui-avatars.com/api/?name=Nafid+Khan&background=d4af37&color=090a0d&bold=true'
          : resolved.shortName === 'Sulthan'
          ? 'https://ui-avatars.com/api/?name=Sulthan+Pullat&background=d4af37&color=090a0d&bold=true'
          : 'https://ui-avatars.com/api/?name=Aflah+RZ&background=d4af37&color=090a0d&bold=true'),
      verifiedAt: new Date().toISOString(),
    };

    res.json({
      authorized: true,
      user,
    });
  } catch (err: any) {
    console.error('Auth verification error:', err);
    res.status(500).json({ authorized: false, error: 'Authentication verification failed' });
  }
});

// Full state endpoint for multi-device synchronization
app.get('/api/state', (req: Request, res: Response) => {
  res.json(db);
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
    (stmt.generatedBy === 'Nafid'
      ? 'goog_nafid_rz'
      : stmt.generatedBy === 'Sulthan'
      ? 'goog_sulthan_rz'
      : 'goog_aflah_rz');
  stmt.created_by_email =
    stmt.created_by_email ||
    (stmt.generatedBy === 'Nafid'
      ? 'nafidkhan@racezoneventures.com'
      : stmt.generatedBy === 'Sulthan'
      ? 'pullatsulthan@gmail.com'
      : 'aflah@racezoneventures.com');
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

// Database Full Backup / Reset
app.post('/api/reset', (req: Request, res: Response) => {
  db = getInitialDatabase();
  saveDatabase(db);
  res.json({ success: true });
});

app.post('/api/import', (req: Request, res: Response) => {
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

startServer();

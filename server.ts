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

// PostgreSQL + Drizzle ORM Database Foundation
import { db as pgDb, pool, isDatabaseConfigured } from './src/db/index.ts';
import {
  createLoadSchema,
  createOrderSchema,
  createGatePassSchema,
  createPaymentSchema,
  createExpenseSchema,
  createIncomeSchema,
  createProductionSchema,
} from './src/db/validators.ts';

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

// Production PostgreSQL + Drizzle Database Status Endpoint
app.get('/api/db/status', async (req: Request, res: Response) => {
  const configured = isDatabaseConfigured();
  if (!configured) {
    return res.json({
      engine: 'PostgreSQL + Drizzle ORM',
      configured: false,
      status: 'FALLBACK_FILE_DB',
      message: 'DATABASE_URL is not set; running on persistent fallback data file.',
    });
  }
  try {
    const result = await pool.query(
      "SELECT NOW() as current_time, count(*) as tables_count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    res.json({
      engine: 'PostgreSQL + Drizzle ORM',
      configured: true,
      status: 'CONNECTED',
      currentTime: result.rows[0]?.current_time,
      tablesCount: Number(result.rows[0]?.tables_count || 0),
    });
  } catch (err: any) {
    res.json({
      engine: 'PostgreSQL + Drizzle ORM',
      configured: true,
      status: 'DISCONNECTED',
      error: err.message,
    });
  }
});

// Authentication endpoint: Direct Access Mode (No Login required)
app.post('/api/auth/verify', (req: Request, res: Response) => {
  const { email, name } = req.body || {};
  const isAflah = email && email.toLowerCase().includes('aflah');
  const shortName = isAflah ? 'Aflah' : 'Nafid';
  res.json({
    authorized: true,
    user: {
      id: isAflah ? 'op_aflah_rz' : 'op_nafid_rz',
      email: isAflah ? 'aflah@racezoneventures.com' : 'nafidkhan@racezoneventures.com',
      name: name || (isAflah ? 'Aflah RZ' : 'Nafid Khan'),
      shortName,
      picture: isAflah
        ? 'https://ui-avatars.com/api/?name=Aflah+RZ&background=d4af37&color=090a0d&bold=true'
        : 'https://ui-avatars.com/api/?name=Nafid+Khan&background=d4af37&color=090a0d&bold=true',
      verifiedAt: new Date().toISOString(),
    },
  });
});

// Full state endpoint for multi-device synchronization
app.get('/api/state', (req: Request, res: Response) => {
  res.json(db);
});

// --- ENTITY MUTATION ENDPOINTS ---

// Load Order
app.post('/api/loads', (req: Request, res: Response) => {
  const validation = createLoadSchema.safeParse(req.body);
  if (!validation.success) {
    console.warn('[Validation Warning /api/loads]:', validation.error.format());
  }

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
  const { activeQuarryId } = req.body;
  if (activeQuarryId) {
    db.activeQuarryId = activeQuarryId;
    saveDatabase(db);
  }
  res.json({ success: true, activeQuarryId: db.activeQuarryId });
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

// Database Full Backup / Reset with Production Safety
app.post('/api/reset', (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const confirmHeader = req.headers['x-admin-confirm'];
  if (isProduction && confirmHeader !== 'CONFIRM_RESET') {
    return res.status(403).json({
      error: 'Production safety lock active. Explicit confirmation required for database reset.',
    });
  }
  db = getInitialDatabase();
  saveDatabase(db);
  res.json({ success: true, message: 'Database reset to initial operational state.' });
});

app.post('/api/import', (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const confirmHeader = req.headers['x-admin-confirm'];
  if (isProduction && confirmHeader !== 'CONFIRM_IMPORT') {
    return res.status(403).json({
      error: 'Production safety lock active. Explicit confirmation required for database restore.',
    });
  }
  try {
    const imported = req.body;
    if (imported.loads && imported.vehicles) {
      db = imported;
      saveDatabase(db);
      res.json({ success: true, message: 'Database imported successfully.' });
    } else {
      res.status(400).json({ error: 'Invalid backup structure. Required keys missing.' });
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

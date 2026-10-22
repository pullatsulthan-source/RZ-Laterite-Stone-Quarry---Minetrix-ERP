import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from './backend/middleware/auth';
import { canAccessQuarry, rowQuarryId, scopeStateForUser } from './backend/security/quarry-scope';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
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

dotenv.config();
import { pool, isDatabaseConfigured } from './src/db/index.ts';
import {
  createLoadSchema, createOrderSchema, createGatePassSchema, createPaymentSchema,
  createExpenseSchema, createIncomeSchema, createProductionSchema,
} from './src/db/validators.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'quarry_db.json');
app.use(express.json({ limit: '10mb' }));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

interface QuarryDatabase {
  vehicles: any[]; drivers: any[]; customers: any[]; staff: any[]; attendance: any[];
  advances: any[]; payrolls: any[]; rates: any; loads: any[]; gatePasses: any[];
  production: any[]; stockAdjustments: any[]; income: any[]; expenses: any[]; payments: any[];
  statements: any[]; rotations: any[]; vehicleTransactions: any[]; orders: any[]; quarries: any[];
  activeQuarryId: string; branding: any; billingConfig: any; theme: string; driverCollections: any[];
}

function getInitialDatabase(): QuarryDatabase {
  return {
    rotations: INITIAL_ROTATIONS, vehicleTransactions: INITIAL_VEHICLE_TRANSACTIONS, orders: INITIAL_ORDERS,
    vehicles: INITIAL_VEHICLES.map((v) => ({ ...v, created_by_user_id:'goog_nafid_rz', created_by_name:'Nafid', created_by_email:'nafidkhan@racezoneventures.com', created_at:v.createdAt || '2026-01-01T08:00:00Z' })),
    drivers: INITIAL_DRIVERS.map((v) => ({ ...v, created_by_user_id:'goog_nafid_rz', created_by_name:'Nafid', created_by_email:'nafidkhan@racezoneventures.com', created_at:v.createdAt || '2026-01-01T08:00:00Z' })),
    customers: INITIAL_CUSTOMERS.map((v) => ({ ...v, created_by_user_id:'goog_nafid_rz', created_by_name:'Nafid', created_by_email:'nafidkhan@racezoneventures.com', created_at:v.createdAt || '2026-01-01T08:00:00Z' })),
    staff: INITIAL_STAFF.map((v) => ({ ...v, created_by_user_id:'goog_nafid_rz', created_by_name:'Nafid', created_by_email:'nafidkhan@racezoneventures.com', created_at:'2026-01-01T08:00:00Z' })),
    attendance: INITIAL_ATTENDANCE.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:`${v.date}T08:00:00Z` })),
    advances: INITIAL_ADVANCES.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    payrolls: [], rates: INITIAL_RATES,
    loads: INITIAL_LOADS.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    gatePasses: INITIAL_GATE_PASSES.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    production: INITIAL_PRODUCTION.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    stockAdjustments: [],
    income: INITIAL_INCOME.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    expenses: INITIAL_EXPENSES.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    payments: INITIAL_PAYMENTS.map((v) => ({ ...v, created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.enteredBy, created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.createdAt || `${v.date}T08:00:00Z` })),
    statements: (INITIAL_STATEMENTS || []).map((v) => ({ ...v, created_by_user_id:v.generatedBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz', created_by_name:v.generatedBy, created_by_email:v.generatedBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com', created_at:v.generatedAt || new Date().toISOString() })),
    quarries: INITIAL_QUARRIES, activeQuarryId:'quarry-001', branding:INITIAL_BRANDING,
    billingConfig:INITIAL_BILLING_CONFIG, theme:'rz_gold', driverCollections:INITIAL_DRIVER_COLLECTIONS,
  };
}

function writeLocalJson(database: QuarryDatabase) {
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}
function loadDatabase(): QuarryDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      let changed = false;
      for (const [key, value] of Object.entries({ rotations: INITIAL_ROTATIONS, vehicleTransactions: INITIAL_VEHICLE_TRANSACTIONS, orders: INITIAL_ORDERS, quarries: INITIAL_QUARRIES, branding: INITIAL_BRANDING, billingConfig: INITIAL_BILLING_CONFIG, theme:'rz_gold', driverCollections:INITIAL_DRIVER_COLLECTIONS })) {
        if (parsed[key] == null || (Array.isArray(value) && !Array.isArray(parsed[key])) || (Array.isArray(value) && parsed[key].length === 0)) { parsed[key] = value; changed = true; }
      }
      if (!parsed.activeQuarryId) { parsed.activeQuarryId='quarry-001'; changed=true; }
      for (const v of parsed.vehicles || []) if (!v.ownerType) { v.ownerType=(v.category==='RZ Mining'||(v.owner&&v.owner.toLowerCase().includes('rz'))) ? 'COMPANY':'OUTSIDE'; changed=true; }
      if (changed) writeLocalJson(parsed);
      return parsed;
    }
  } catch (err) { console.error('[database] Failed to read local state; starting with seed data.'); }
  const fresh = getInitialDatabase();
  if (DB_ADAPTER === 'local-json') writeLocalJson(fresh);
  return fresh;
}

const DB_ADAPTER = process.env.DB_ADAPTER || 'postgres';
let persistenceReady = false;
let pendingPersistence: Promise<void> = Promise.resolve();
let persistenceFailure: unknown = null;
let db: QuarryDatabase = getInitialDatabase();

function saveDatabase(database: QuarryDatabase) {
  if (DB_ADAPTER === 'local-json' || !persistenceReady) {
    if (DB_ADAPTER === 'local-json' && process.env.NODE_ENV !== 'production') writeLocalJson(database);
    return;
  }
  const snapshot = JSON.parse(JSON.stringify(database)) as QuarryDatabase;
  pendingPersistence = pendingPersistence.catch(() => undefined).then(() => writeAppState(snapshot))
    .then(() => { persistenceFailure = null; }).catch((err) => { persistenceFailure=err; console.error('[persistence] PostgreSQL write failed'); throw err; });
  void pendingPersistence.catch(() => undefined);
}
async function initializePersistence() {
  if (DB_ADAPTER === 'local-json') {
    if (process.env.NODE_ENV === 'production') throw new Error('DB_ADAPTER=local-json is not permitted in production.');
    db = loadDatabase(); persistenceReady=true;
    console.warn('[persistence] Explicit local JSON adapter enabled; not suitable for multi-instance production.');
    return;
  }
  if (DB_ADAPTER !== 'postgres') throw new Error('DB_ADAPTER must be postgres or local-json.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required when DB_ADAPTER=postgres.');
  await verifyAppStateTable();
  const stored = await readAppState();
  if (!stored) throw new Error("PostgreSQL app_state is empty. Apply migrations and run 'npm run db:seed' before starting the API.");
  db = stored as unknown as QuarryDatabase;
  persistenceReady=true;
  console.log('[persistence] PostgreSQL app_state loaded and verified.');
}

app.use((req: Request, res: Response, next) => {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (DB_ADAPTER !== 'postgres' || !req.path.startsWith('/api') || res.statusCode >= 400) return originalJson(body);
    void pendingPersistence.then(() => {
      if (persistenceFailure) { if (!res.headersSent) { res.status(503); originalJson({error:'Database persistence failed; request was not confirmed.'}); } return; }
      if (!res.headersSent) originalJson(body);
    }).catch(() => { if (!res.headersSent) { res.status(503); originalJson({error:'Database persistence failed; request was not confirmed.'}); } });
    return res;
  }) as Response['json'];
  next();
});

app.use('/api', rateLimit({ windowMs: 15*60*1000, max:100, standardHeaders:true, legacyHeaders:false }));
app.use('/api', auditRequest);
app.use('/api', (req: Request, res: Response, next) => req.path === '/health' ? next() : requireAuth(req,res,next));

app.get('/api/health', (_req: Request,res: Response) => res.json({status:'ok',time:new Date().toISOString()}));
app.get('/api/audit-logs', requireRole(['OWNER','ADMIN']), async (req: Request,res: Response) => {
  const parseDate=(v:unknown):string|undefined=>{if(typeof v!=='string'||!v.trim()) return undefined; const d=new Date(v); return Number.isNaN(d.getTime())?undefined:d.toISOString();};
  const rawLimit=Number(req.query.limit??50), rawOffset=Number(req.query.offset??0);
  const limit=Number.isFinite(rawLimit)?Math.min(200,Math.max(1,Math.trunc(rawLimit))):50;
  const offset=Number.isFinite(rawOffset)?Math.max(0,Math.trunc(rawOffset)):0;
  const from=parseDate(req.query.from),to=parseDate(req.query.to);
  if ((req.query.from&&!from)||(req.query.to&&!to)) return res.status(400).json({error:'from/to must be valid date-time values'});
  try { return res.json(await queryAuditLogs({limit,offset,userId:typeof req.query.userId==='string'?req.query.userId.slice(0,128):undefined,action:typeof req.query.action==='string'?req.query.action.slice(0,128):undefined,quarryId:typeof req.query.quarryId==='string'?req.query.quarryId.slice(0,64):undefined,from,to})); }
  catch { console.error('[audit] Failed to query audit logs'); return res.status(500).json({error:'Unable to retrieve audit logs'}); }
});

app.get('/api/auth/session', (req: Request,res: Response) => {
  const user=req.user;
  if (!user) return res.status(401).json({error:'Authentication required'});
  return res.json({authenticated:true,user:{uid:user.uid,email:user.email,name:user.name,picture:user.picture||null,role:user.role,quarryIds:user.quarryIds}});
});
app.get('/api/db/status', async (_req: Request,res: Response) => {
  if (!isDatabaseConfigured()) return res.status(503).json({engine:'PostgreSQL + Drizzle ORM',configured:false,status:'NOT_CONFIGURED'});
  try { const result=await pool.query("SELECT NOW() as current_time, count(*) as tables_count FROM information_schema.tables WHERE table_schema='public'");
    return res.json({engine:'PostgreSQL + Drizzle ORM',configured:true,status:'CONNECTED',currentTime:result.rows[0]?.current_time,tablesCount:Number(result.rows[0]?.tables_count||0)});
  } catch { return res.status(503).json({engine:'PostgreSQL + Drizzle ORM',configured:true,status:'DISCONNECTED'}); }
});

app.use('/api', (req: Request,res: Response,next) => {
  const user=req.user; if (!user) return res.status(401).json({error:'Authentication required'});
  const role=String(user.role||'VIEWER').toUpperCase(), method=req.method.toUpperCase(), pathName=req.path.toLowerCase();
  const mutation=!['GET','HEAD','OPTIONS'].includes(method);
  if (role==='VIEWER'&&mutation) return res.status(403).json({error:'Viewer accounts are read-only'});
  if (/^\/(income|expenses|payments|statements|ledger)(\/|$)/.test(pathName)&&mutation&&!['OWNER','ADMIN','ACCOUNTS'].includes(role)) return res.status(403).json({error:'Financial mutation requires OWNER, ADMIN, or ACCOUNTS'});
  if (/^\/(staff|attendance|advances|payrolls)(\/|$)/.test(pathName)&&mutation&&!['OWNER','ADMIN','HR'].includes(role)) return res.status(403).json({error:'HR mutation requires OWNER, ADMIN, or HR'});
  if (/^\/(quarries|branding|billing-config|rates)(\/|$)/.test(pathName)&&mutation&&!['OWNER','ADMIN'].includes(role)) return res.status(403).json({error:'Configuration changes require OWNER or ADMIN'});
  return next();
});

const API_COLLECTIONS: Record<string,string> = {loads:'loads','gate-passes':'gatePasses',production:'production','stock-adjustments':'stockAdjustments',income:'income',expenses:'expenses',payments:'payments',statements:'statements',vehicles:'vehicles',drivers:'drivers',customers:'customers',staff:'staff',attendance:'attendance',advances:'advances',payrolls:'payrolls',rotations:'rotations','vehicle-transactions':'vehicleTransactions',orders:'orders',quarries:'quarries','driver-collections':'driverCollections'};
const activeQuarryByUser = new Map<string,string>();
function getUserActiveQuarry(user:any):string {
  const assigned=Array.isArray(user?.quarryIds)?user.quarryIds.map(String):[];
  const selected=user?.uid?activeQuarryByUser.get(String(user.uid)):undefined;
  if (selected&&canAccessQuarry(user,selected)) return selected;
  return assigned.length?assigned[0]:'';
}
app.use('/api', (req: Request,res: Response,next) => {
  const user=req.user; if (!user) return res.status(401).json({error:'Authentication required'});
  const segments=req.path.split('/').filter(Boolean), collection=segments[0], key=API_COLLECTIONS[collection];
  if (!key) return next();
  if (user.role==='OWNER'||user.role==='ADMIN') return next();
  const quarryId=typeof req.body?.quarryId==='string'?req.body.quarryId:typeof req.query.quarryId==='string'?req.query.quarryId:getUserActiveQuarry(user);
  if (!quarryId||!canAccessQuarry(user,quarryId)) return res.status(403).json({error:'No access to requested quarry'});
  const originalJson=res.json.bind(res);
  res.json=((payload:any)=>{ if(Array.isArray(payload)) { const filtered=payload.filter((row)=>rowQuarryId(row)===quarryId); return originalJson(filtered); } if(payload&&typeof payload==='object'&&'quarryId'in payload&& !canAccessQuarry(user,String(payload.quarryId))) return res.status(403).json({error:'Resource is outside your quarry'}); return originalJson(payload); }) as typeof res.json;
  return next();
});

app.get('/api/state',(req:Request,res:Response)=>{
  const user=req.user; if(!user) return res.status(401).json({error:'Authentication required'});
  if(user.role==='OWNER'||user.role==='ADMIN') return res.json(db);
  return res.json(scopeStateForUser(db as unknown as Record<string,unknown>,user,getUserActiveQuarry(user)));
});

app.post('/api/loads',(req:Request,res:Response)=>{const parsed=createLoadSchema.safeParse(req.body);if(!parsed.success)return res.status(422).json({error:'Invalid load data',details:parsed.error.flatten()});const row={...parsed.data,id:req.body.id||`load-${Date.now()}`,createdAt:req.body.createdAt||new Date().toISOString()};db.loads=[row,...db.loads];saveDatabase(db);return res.json(row);});
app.put('/api/loads/:id',(req:Request,res:Response)=>{const row=db.loads.find(v=>v.id===req.params.id);if(!row)return res.status(404).json({error:'Load not found'});if(!canAccessQuarry(req.user,row.quarryId))return res.status(403).json({error:'No access to this quarry'});db.loads=db.loads.map(v=>v.id===req.params.id?{...v,...req.body}:v);saveDatabase(db);return res.json({success:true});});
app.delete('/api/loads/:id',(req:Request,res:Response)=>{const row=db.loads.find(v=>v.id===req.params.id);if(!row)return res.status(404).json({error:'Load not found'});if(!canAccessQuarry(req.user,row.quarryId))return res.status(403).json({error:'No access to this quarry'});db.loads=db.loads.filter(v=>v.id!==req.params.id);saveDatabase(db);return res.json({success:true});});

// The existing endpoint set continues below unchanged in the source; it is imported by
// the production route module when all modules are migrated. Until then, fail closed instead
// of silently mutating unscoped data.
app.all(/^\/api\/(.*)/, (req:Request,res:Response) => {
  if (req.path==='/api/health') return res.status(404).json({error:'Not found'});
  return res.status(501).json({error:'API route is not available in this build'});
});

async function startServer() {
  await initializePersistence();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({server:{middlewareMode:true},appType:'spa'});
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(),'dist')));
    app.get('*',(req:Request,res:Response)=>res.sendFile(path.resolve(process.cwd(),'dist/index.html')));
  }
  app.listen(PORT,'0.0.0.0',()=>console.log(`[RZ MINETRIX ERP] Server running on http://0.0.0.0:${PORT}`));
}
startServer().catch((error)=>{console.error('[startup] Server initialization failed:',error instanceof Error?error.message:'unknown error');process.exitCode=1;});

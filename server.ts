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
    vehicles: INITIAL_VEHICLES.map(v => ({...v,created_by_user_id:'goog_nafid_rz',created_by_name:'Nafid',created_by_email:'nafidkhan@racezoneventures.com',created_at:v.createdAt||'2026-01-01T08:00:00Z'})),
    drivers: INITIAL_DRIVERS.map(v => ({...v,created_by_user_id:'goog_nafid_rz',created_by_name:'Nafid',created_by_email:'nafidkhan@racezoneventures.com',created_at:v.createdAt||'2026-01-01T08:00:00Z'})),
    customers: INITIAL_CUSTOMERS.map(v => ({...v,created_by_user_id:'goog_nafid_rz',created_by_name:'Nafid',created_by_email:'nafidkhan@racezoneventures.com',created_at:v.createdAt||'2026-01-01T08:00:00Z'})),
    staff: INITIAL_STAFF.map(v => ({...v,created_by_user_id:'goog_nafid_rz',created_by_name:'Nafid',created_by_email:'nafidkhan@racezoneventures.com',created_at:'2026-01-01T08:00:00Z'})),
    attendance: INITIAL_ATTENDANCE.map(v => ({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:`${v.date}T08:00:00Z`})),
    advances: INITIAL_ADVANCES.map(v => ({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    payrolls:[], rates:INITIAL_RATES,
    loads:INITIAL_LOADS.map(v=>({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    gatePasses:INITIAL_GATE_PASSES.map(v=>({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    production:INITIAL_PRODUCTION.map(v=>({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    stockAdjustments:[],
    income:INITIAL_INCOME.map(v=>({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    expenses:INITIAL_EXPENSES.map(v=>({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    payments:INITIAL_PAYMENTS.map(v=>({...v,created_by_user_id:v.enteredBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.enteredBy,created_by_email:v.enteredBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.createdAt||`${v.date}T08:00:00Z`})),
    statements:(INITIAL_STATEMENTS||[]).map(v=>({...v,created_by_user_id:v.generatedBy==='Nafid'?'goog_nafid_rz':'goog_aflah_rz',created_by_name:v.generatedBy,created_by_email:v.generatedBy==='Nafid'?'nafidkhan@racezoneventures.com':'aflah@racezoneventures.com',created_at:v.generatedAt||new Date().toISOString()})),
    quarries:INITIAL_QUARRIES,activeQuarryId:'quarry-001',branding:INITIAL_BRANDING,billingConfig:INITIAL_BILLING_CONFIG,theme:'rz_gold',driverCollections:INITIAL_DRIVER_COLLECTIONS,
  };
}
function writeLocalJson(database:QuarryDatabase) {
  const tmp=`${DB_FILE}.tmp`; fs.writeFileSync(tmp,JSON.stringify(database,null,2),'utf-8'); fs.renameSync(tmp,DB_FILE);
}
function loadDatabase():QuarryDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed=JSON.parse(fs.readFileSync(DB_FILE,'utf-8')); let changed=false;
      const defaults:any={rotations:INITIAL_ROTATIONS,vehicleTransactions:INITIAL_VEHICLE_TRANSACTIONS,orders:INITIAL_ORDERS,quarries:INITIAL_QUARRIES,branding:INITIAL_BRANDING,billingConfig:INITIAL_BILLING_CONFIG,theme:'rz_gold',driverCollections:INITIAL_DRIVER_COLLECTIONS};
      for(const [k,v] of Object.entries(defaults)) if(parsed[k]==null||(Array.isArray(v)&&(!Array.isArray(parsed[k])||parsed[k].length===0))){parsed[k]=v;changed=true;}
      if(!parsed.activeQuarryId){parsed.activeQuarryId='quarry-001';changed=true;}
      for(const v of parsed.vehicles||[]) if(!v.ownerType){v.ownerType=(v.category==='RZ Mining'||(v.owner&&v.owner.toLowerCase().includes('rz')))?'COMPANY':'OUTSIDE';changed=true;}
      if(changed)writeLocalJson(parsed); return parsed;
    }
  } catch { console.error('[database] Local state invalid; seed defaults will be used.'); }
  const initial=getInitialDatabase(); if(DB_ADAPTER==='local-json'&&process.env.NODE_ENV!=='production') writeLocalJson(initial); return initial;
}
const DB_ADAPTER=process.env.DB_ADAPTER||'postgres';
let persistenceReady=false; let pendingPersistence:Promise<void>=Promise.resolve(); let persistenceFailure:unknown=null;
let db:QuarryDatabase=getInitialDatabase();
function saveDatabase(database:QuarryDatabase) {
  if(DB_ADAPTER==='local-json'||!persistenceReady){if(DB_ADAPTER==='local-json'&&process.env.NODE_ENV!=='production')writeLocalJson(database);return;}
  const snapshot=JSON.parse(JSON.stringify(database)) as QuarryDatabase;
  pendingPersistence=pendingPersistence.catch(()=>undefined).then(()=>writeAppState(snapshot)).then(()=>{persistenceFailure=null;}).catch(err=>{persistenceFailure=err;console.error('[persistence] PostgreSQL write failed');throw err;});
  void pendingPersistence.catch(()=>undefined);
}
async function initializePersistence() {
  if(DB_ADAPTER==='local-json'){if(process.env.NODE_ENV==='production')throw new Error('DB_ADAPTER=local-json is not permitted in production.');db=loadDatabase();persistenceReady=true;console.warn('[persistence] Local JSON adapter enabled; development only.');return;}
  if(DB_ADAPTER!=='postgres')throw new Error('DB_ADAPTER must be postgres or local-json.');
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required when DB_ADAPTER=postgres.');
  await verifyAppStateTable(); const stored=await readAppState();
  if(!stored)throw new Error("PostgreSQL app_state is empty. Apply migrations and run 'npm run db:seed' before starting.");
  db=stored as unknown as QuarryDatabase;persistenceReady=true;console.log('[persistence] PostgreSQL app_state loaded.');
}
app.use((req:Request,res:Response,next)=>{const original=res.json.bind(res);res.json=((body:unknown)=>{if(DB_ADAPTER!=='postgres'||!req.path.startsWith('/api')||res.statusCode>=400)return original(body);void pendingPersistence.then(()=>{if(persistenceFailure){if(!res.headersSent){res.status(503);original({error:'Database persistence failed'});}return;}if(!res.headersSent)original(body);}).catch(()=>{if(!res.headersSent){res.status(503);original({error:'Database persistence failed'});}});return res.json as any;}) as Response['json'];next();});
app.use('/api',rateLimit({windowMs:15*60*1000,max:100,standardHeaders:true,legacyHeaders:false}));
app.use('/api',auditRequest);
app.use('/api',(req:Request,res:Response,next)=>req.path==='/health'?next():requireAuth(req,res,next));
app.get('/api/health',(_req:Request,res:Response)=>res.json({status:'ok',time:new Date().toISOString()}));
app.get('/api/audit-logs',requireRole(['OWNER','ADMIN']),async(req:Request,res:Response)=>{
  const date=(v:unknown)=>{if(typeof v!=='string'||!v.trim())return undefined;const d=new Date(v);return Number.isNaN(d.getTime())?undefined:d.toISOString();};
  const limit=Math.min(200,Math.max(1,Math.trunc(Number(req.query.limit??50)||50))),offset=Math.max(0,Math.trunc(Number(req.query.offset??0)||0));
  const from=date(req.query.from),to=date(req.query.to);if((req.query.from&&!from)||(req.query.to&&!to))return res.status(400).json({error:'from/to must be valid date-time values'});
  try{return res.json(await queryAuditLogs({limit,offset,userId:typeof req.query.userId==='string'?req.query.userId.slice(0,128):undefined,action:typeof req.query.action==='string'?req.query.action.slice(0,128):undefined,quarryId:typeof req.query.quarryId==='string'?req.query.quarryId.slice(0,64):undefined,from,to}));}catch{return res.status(500).json({error:'Unable to retrieve audit logs'});}
});
app.get('/api/auth/session',(req:Request,res:Response)=>{const user=req.user;if(!user)return res.status(401).json({error:'Authentication required'});return res.json({authenticated:true,user:{uid:user.uid,email:user.email,name:user.name,picture:user.picture||null,role:user.role,quarryIds:user.quarryIds}});});
app.get('/api/db/status',async(_req:Request,res:Response)=>{if(!isDatabaseConfigured())return res.status(503).json({engine:'PostgreSQL + Drizzle ORM',configured:false,status:'NOT_CONFIGURED'});try{const q=await pool.query("SELECT NOW() AS current_time,count(*) AS tables_count FROM information_schema.tables WHERE table_schema='public'");return res.json({engine:'PostgreSQL + Drizzle ORM',configured:true,status:'CONNECTED',currentTime:q.rows[0]?.current_time,tablesCount:Number(q.rows[0]?.tables_count||0)});}catch{return res.status(503).json({engine:'PostgreSQL + Drizzle ORM',configured:true,status:'DISCONNECTED'});}});
app.use('/api',(req:Request,res:Response,next)=>{const u=req.user;if(!u)return res.status(401).json({error:'Authentication required'});const role=String(u.role||'VIEWER').toUpperCase(),mutation=!['GET','HEAD','OPTIONS'].includes(req.method.toUpperCase()),p=req.path.toLowerCase();if(role==='VIEWER'&&mutation)return res.status(403).json({error:'Viewer accounts are read-only'});if(/^\/(income|expenses|payments|statements|ledger)(\/|$)/.test(p)&&mutation&&!['OWNER','ADMIN','ACCOUNTS'].includes(role))return res.status(403).json({error:'Financial mutation requires OWNER, ADMIN, or ACCOUNTS'});if(/^\/(staff|attendance|advances|payrolls)(\/|$)/.test(p)&&mutation&&!['OWNER','ADMIN','HR'].includes(role))return res.status(403).json({error:'HR mutation requires OWNER, ADMIN, or HR'});if(/^\/(quarries|branding|billing-config|rates)(\/|$)/.test(p)&&mutation&&!['OWNER','ADMIN'].includes(role))return res.status(403).json({error:'Configuration changes require OWNER or ADMIN'});return next();});
const COLLECTIONS:Record<string,string>={loads:'loads','gate-passes':'gatePasses',production:'production','stock-adjustments':'stockAdjustments',income:'income',expenses:'expenses',payments:'payments',statements:'statements',vehicles:'vehicles',drivers:'drivers',customers:'customers',staff:'staff',attendance:'attendance',advances:'advances',payrolls:'payrolls',rotations:'rotations','vehicle-transactions':'vehicleTransactions',orders:'orders',quarries:'quarries','driver-collections':'driverCollections'};
const activeQuarryByUser=new Map<string,string>();
function activeQuarry(user:any){const ids=Array.isArray(user?.quarryIds)?user.quarryIds.map(String):[];const selected=user?.uid?activeQuarryByUser.get(String(user.uid)):undefined;return selected&&canAccessQuarry(user,selected)?selected:(ids[0]||'');}
app.use('/api',(req:Request,res:Response,next)=>{const u=req.user;if(!u)return res.status(401).json({error:'Authentication required'});const collection=req.path.split('/').filter(Boolean)[0];if(!COLLECTIONS[collection]||u.role==='OWNER'||u.role==='ADMIN')return next();const id=typeof req.body?.quarryId==='string'?req.body.quarryId:typeof req.query.quarryId==='string'?req.query.quarryId:activeQuarry(u);if(!id||!canAccessQuarry(u,id))return res.status(403).json({error:'No access to requested quarry'});const original=res.json.bind(res);res.json=((payload:any)=>Array.isArray(payload)?original(payload.filter(row=>rowQuarryId(row)===id)):original(payload)) as typeof res.json;next();});
app.get('/api/state',(req:Request,res:Response)=>{const u=req.user;if(!u)return res.status(401).json({error:'Authentication required'});return res.json(u.role==='OWNER'||u.role==='ADMIN'?db:scopeStateForUser(db as unknown as Record<string,unknown>,u,activeQuarry(u)));});

function route(pathName:string,collection:keyof QuarryDatabase,validator?:any){
  app.get('/api/'+pathName,(_req:Request,res:Response)=>res.json((db[collection] as any)||[]));
  app.post('/api/'+pathName,(req:Request,res:Response)=>{const input=validator?validator.safeParse(req.body):{success:true,data:req.body};if(!input.success)return res.status(422).json({error:'Invalid data',details:input.error.flatten()});const row={...input.data,id:req.body.id||pathName+'-'+Date.now(),createdAt:req.body.createdAt||new Date().toISOString()};(db[collection] as any)=[row,...((db[collection] as any)||[])];saveDatabase(db);return res.status(201).json(row);});
  app.put('/api/'+pathName+'/:id',(req:Request,res:Response)=>{const rows=(db[collection] as any)||[];const index=rows.findIndex((x:any)=>x.id===req.params.id);if(index<0)return res.status(404).json({error:'Not found'});rows[index]={...rows[index],...req.body};saveDatabase(db);return res.json({success:true});});
  app.delete('/api/'+pathName+'/:id',(req:Request,res:Response)=>{const before=(db[collection] as any)||[];const after=before.filter((x:any)=>x.id!==req.params.id);if(after.length===before.length)return res.status(404).json({error:'Not found'});(db[collection] as any)=after;saveDatabase(db);return res.json({success:true});});
}
route('loads','loads',createLoadSchema); route('gate-passes','gatePasses',createGatePassSchema); route('production','production',createProductionSchema);
route('stock-adjustments','stockAdjustments'); route('income','income',createIncomeSchema); route('expenses','expenses',createExpenseSchema);
route('payments','payments',createPaymentSchema); route('statements','statements'); route('vehicles','vehicles'); route('drivers','drivers');
route('customers','customers'); route('staff','staff'); route('attendance','attendance'); route('advances','advances'); route('payrolls','payrolls');
route('rotations','rotations'); route('vehicle-transactions','vehicleTransactions'); route('orders','orders',createOrderSchema); route('quarries','quarries');
route('driver-collections','driverCollections');
app.get('/api/branding',(_req:Request,res:Response)=>res.json(db.branding||INITIAL_BRANDING));
app.put('/api/branding',(req:Request,res:Response)=>{if(!['OWNER','ADMIN'].includes(String(req.user?.role).toUpperCase()))return res.status(403).json({error:'Admin required'});db.branding={...db.branding,...req.body};saveDatabase(db);return res.json(db.branding);});
app.get('/api/billing-config',(_req:Request,res:Response)=>res.json(db.billingConfig||INITIAL_BILLING_CONFIG));
app.put('/api/billing-config',(req:Request,res:Response)=>{if(!['OWNER','ADMIN'].includes(String(req.user?.role).toUpperCase()))return res.status(403).json({error:'Admin required'});db.billingConfig={...db.billingConfig,...req.body};saveDatabase(db);return res.json(db.billingConfig);});
app.get('/api/rates',(_req:Request,res:Response)=>res.json(db.rates||INITIAL_RATES));
app.put('/api/rates',(req:Request,res:Response)=>{if(!['OWNER','ADMIN'].includes(String(req.user?.role).toUpperCase()))return res.status(403).json({error:'Admin required'});db.rates=req.body;saveDatabase(db);return res.json({success:true});});
app.post('/api/active-quarry',(req:Request,res:Response)=>{const u=req.user;if(!u)return res.status(401).json({error:'Authentication required'});const id=req.body?.activeQuarryId;if(typeof id!=='string'||!id.trim())return res.status(422).json({error:'activeQuarryId is required'});if(!canAccessQuarry(u,id.trim()))return res.status(403).json({error:'No access to requested quarry'});activeQuarryByUser.set(u.uid,id.trim());return res.json({success:true,activeQuarryId:id.trim()});});
app.post('/api/reset',requireRole('OWNER'),(req:Request,res:Response)=>{if(process.env.NODE_ENV==='production'||process.env.ENABLE_RESET!=='true')return res.status(403).json({error:'Reset disabled'});if(req.headers['x-confirm-reset']!=='CONFIRM_RESET')return res.status(400).json({error:'Explicit reset confirmation required'});db=getInitialDatabase();saveDatabase(db);return res.json({success:true});});
app.post('/api/import',requireRole(['OWNER','ADMIN']),(req:Request,res:Response)=>{if(req.headers['x-confirm-import']!=='CONFIRM_IMPORT')return res.status(400).json({error:'Explicit import confirmation required'});const x=req.body;if(!x||!Array.isArray(x.loads)||!Array.isArray(x.vehicles))return res.status(400).json({error:'Invalid backup structure'});db=x;saveDatabase(db);return res.json({success:true});});

app.all(/^\/api\/(.*)/,(req:Request,res:Response)=>res.status(404).json({error:'Unknown API route'}));
async function startServer(){await initializePersistence();if(process.env.NODE_ENV!=='production'){const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}else{app.use(express.static(path.resolve(process.cwd(),'dist')));app.get('*',(req:Request,res:Response)=>res.sendFile(path.resolve(process.cwd(),'dist/index.html'));}app.listen(PORT,'0.0.0.0',()=>console.log(`[RZ MINETRIX ERP] Server running on http://0.0.0.0:${PORT}`));}
startServer().catch(error=>{console.error('[startup] Server initialization failed:',error instanceof Error?error.message:'unknown error');process.exitCode=1;});

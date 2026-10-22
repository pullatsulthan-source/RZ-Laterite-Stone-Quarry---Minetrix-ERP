#!/usr/bin/env node
/** Safely imports quarry data from the legacy JSON store into PostgreSQL. */
import fs from 'node:fs';
import path from 'node:path';
import { db, isDatabaseConfigured } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';

interface ReconciliationMetric {
  sourceCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
}

async function runMigration() {
  if (!isDatabaseConfigured()) throw new Error('DATABASE_URL must be configured for a real migration; dry runs must not report data as imported.');
  const jsonFilePath = path.resolve(process.cwd(), 'data', 'quarry_db.json');
  if (!fs.existsSync(jsonFilePath)) throw new Error(`Source JSON file not found: ${jsonFilePath}`);
  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
  const metrics: Record<string, ReconciliationMetric> = {};
  const collections = ['quarries','vehicles','drivers','customers','staff','orders','loads','gatePasses','production','expenses','payments','income'];
  for (const name of collections) {
    const values = Array.isArray(data[name]) ? data[name] : [];
    metrics[name] = { sourceCount: values.length, importedCount: 0, skippedCount: 0, failedCount: 0 };
  }
  const defaultQuarryId = String(data.activeQuarryId || data.quarries?.[0]?.id || 'quarry-001');
  const numeric = (v: unknown, fallback = 0) => {
    const n = Number(v ?? fallback);
    return Number.isFinite(n) ? String(n) : String(fallback);
  };
  await db.transaction(async (tx) => {
    for (const q of data.quarries || []) {
      try {
        await tx.insert(schema.quarries).values({
          id: String(q.id), quarryCode: String(q.quarryCode || `RZ-Q${q.id}`),
          quarryName: String(q.quarryName || q.name || 'Quarry'),
          businessName: String(q.businessName || 'RZ Mining Ventures LLP'),
          address: q.address ?? null, location: q.location ?? null, phone: q.phone ?? null,
          email: q.email ?? null, owner: q.owner ?? null, active: q.active ?? true, notes: q.notes ?? null,
        }).onConflictDoNothing();
        metrics.quarries.importedCount++;
      } catch { metrics.quarries.failedCount++; }
    }
    for (const v of data.vehicles || []) {
      try {
        await tx.insert(schema.vehicles).values({
          id: String(v.id), quarryId: String(v.quarryId || defaultQuarryId), vehicleNumber: String(v.vehicleNumber || v.number || v.id),
          owner: v.owner ?? null, driver: v.driver ?? null, phone: v.phone ?? null,
          category: String(v.category || 'Outside Vehicle'), ownerType: String(v.ownerType || 'OUTSIDE'),
          tripRent: numeric(v.tripRent, 700), capacity: Number(v.capacity || 260),
          status: String(v.status || 'Active'), active: v.active ?? true, notes: v.remarks ?? v.notes ?? null,
        }).onConflictDoNothing();
        metrics.vehicles.importedCount++;
      } catch { metrics.vehicles.failedCount++; }
    }
    for (const l of data.loads || []) {
      try {
        await tx.insert(schema.loads).values({
          id: String(l.id), quarryId: String(l.quarryId || defaultQuarryId), sectionId: l.sectionId ?? null,
          loadNumber: String(l.loadNumber || l.id), date: String(l.date || new Date().toISOString().slice(0,10)),
          time: String(l.time || '10:00'), vehicleId: l.vehicleId ?? null, vehicleNumber: String(l.vehicleNumber || ''),
          vehicleCategory: String(l.vehicleCategory || 'Outside'), driverId: l.driverId ?? null,
          driverName: String(l.driver || l.driverName || 'Driver'), ownerName: l.owner ?? l.ownerName ?? null,
          customerId: l.customerId ?? null, customerName: String(l.customerName || ''),
          destination: l.destination ?? null, material: String(l.material || '1st Quality'),
          quantity: Number(l.quantity || 260), unit: String(l.unit || 'pcs'), capacity: Number(l.capacity || 260),
          freeQuantity: Number(l.freeQuantity ?? 5), ratedQuantity: Number(l.ratedQuantity ?? 255),
          actualLoadedQuantity: l.actualLoadedQuantity == null ? null : Number(l.actualLoadedQuantity),
          actualGateOutQuantity: l.actualGateOutQuantity == null ? null : Number(l.actualGateOutQuantity),
          billableQuantity: l.billableQuantity == null ? null : Number(l.billableQuantity),
          vehicleReceivedQuantity: l.vehicleReceivedQuantity == null ? null : Number(l.vehicleReceivedQuantity),
          rateCondition: String(l.rateCondition || 'Standard Rock'), gapPosition: Number(l.gapPosition || 1),
          roundNumber: Number(l.roundNumber || 1), isSpecialTradingLoad: Boolean(l.isSpecialTradingLoad),
          loadType: String(l.loadType || 'QUARRY_SALE'), loadingPaidByQuarry: Boolean(l.loadingPaidByQuarry),
          quarryRate: numeric(l.quarryRate, 43), quarryAmount: numeric(l.quarryAmount),
          customerSaleRate: numeric(l.customerSaleRate, 65), customerSaleAmount: numeric(l.customerSaleAmount),
          driverBatta: numeric(l.driverBatta), vehicleTripRent: numeric(l.vehicleTripRent), loadingCharge: numeric(l.loadingCharge),
          diesel: numeric(l.diesel), orderCommission: numeric(l.orderCommission), otherExpense: numeric(l.otherExpense),
          totalExpense: numeric(l.totalExpense), netProfit: numeric(l.netProfit), paymentReceived: numeric(l.paymentReceived),
          balance: numeric(l.balance), status: String(l.status || 'Loaded'), gatePassNumber: l.gatePassNumber ?? null,
          enteredBy: String(l.enteredBy || 'Nafid'), remarks: l.remarks ?? null,
        }).onConflictDoNothing();
        metrics.loads.importedCount++;
      } catch { metrics.loads.failedCount++; }
    }
  });
  console.log('Migration reconciliation report');
  console.table(Object.entries(metrics).map(([entity, m]) => ({
    entity, source: m.sourceCount, importedOrAlreadyPresent: m.importedCount,
    skipped: m.skippedCount, failed: m.failedCount,
    status: m.failedCount === 0 && m.importedCount === m.sourceCount ? 'CHECK COUNTS / VERIFIED' : 'VARIANCE',
  })));
  if (Object.values(metrics).some(m => m.failedCount > 0)) throw new Error('Migration had failed rows; investigate before cutover.');
}
runMigration().then(() => { console.log('Migration script finished.'); }).catch((err) => {
  console.error('Migration failed:', err instanceof Error ? err.message : 'unknown error');
  process.exitCode = 1;
});

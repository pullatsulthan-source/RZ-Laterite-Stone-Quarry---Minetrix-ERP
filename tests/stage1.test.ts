import assert from 'node:assert/strict';
import test from 'node:test';
import { createJcbLogSchema, createLoadSchema } from '../src/db/validators.ts';

test('Stage 1: load validator accepts a valid quarry load', () => {
  const result = createLoadSchema.safeParse({
    quarryId: 'quarry-001',
    loadNumber: 'L-001',
    date: '2026-10-22',
    time: '10:00',
    vehicleNumber: 'KL-10-AB-1234',
    driverName: 'Driver',
    customerName: 'Customer',
    material: '1st Quality',
    quantity: 255,
    quarryRate: 43,
    quarryAmount: 10965,
    customerSaleRate: 50,
    customerSaleAmount: 12750,
    enteredBy: 'test-user',
  });
  assert.equal(result.success, true);
});

test('Stage 1: JCB validator rejects decreasing hour-meter readings', () => {
  const result = createJcbLogSchema.safeParse({
    quarryId: 'quarry-001',
    machineId: 'jcb-001',
    date: '2026-10-22',
    operator: 'Operator',
    startHourReading: 1200,
    endHourReading: 1199,
    verifiedBy: 'Supervisor',
  });
  assert.equal(result.success, false);
});

test('Stage 1: JCB validator accepts non-decreasing hour-meter readings', () => {
  const result = createJcbLogSchema.safeParse({
    quarryId: 'quarry-001',
    machineId: 'jcb-001',
    date: '2026-10-22',
    operator: 'Operator',
    startHourReading: 1200,
    endHourReading: 1204.5,
    verifiedBy: 'Supervisor',
  });
  assert.equal(result.success, true);
});

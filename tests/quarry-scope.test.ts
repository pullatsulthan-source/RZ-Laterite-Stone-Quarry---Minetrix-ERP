import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessQuarry, rowQuarryId, scopeStateForUser } from '../backend/security/quarry-scope.ts';

test('quarry scope permits only assigned quarry IDs for scoped users', () => {
  assert.equal(canAccessQuarry({ role: 'QUARRY_MANAGER', quarryIds: ['q-1'] }, 'q-1'), true);
  assert.equal(canAccessQuarry({ role: 'QUARRY_MANAGER', quarryIds: ['q-1'] }, 'q-2'), false);
});

test('quarry scope normalizes role case and fails closed without membership data', () => {
  assert.equal(canAccessQuarry({ role: 'owner', quarryIds: [] }, 'q-2'), true);
  assert.equal(canAccessQuarry({ role: 'admin', quarryIds: [] }, 'q-2'), true);
  assert.equal(canAccessQuarry({ role: 'VIEWER' }, 'q-1'), false);
  assert.equal(canAccessQuarry({ role: 'VIEWER', quarryIds: null }, 'q-1'), false);
});

test('row quarry ID accepts camelCase and database snake_case', () => {
  assert.equal(rowQuarryId({ quarryId: 'q-1' }), 'q-1');
  assert.equal(rowQuarryId({ quarry_id: 'q-2' }), 'q-2');
  assert.equal(rowQuarryId({ quarryId: '' }), null);
  assert.equal(rowQuarryId(null), null);
});

test('scoped state only includes assigned quarry records and hides global settings', () => {
  const state = {
    quarries: [{ id: 'q-1' }, { id: 'q-2' }],
    loads: [
      { id: 'l-1', quarryId: 'q-1' },
      { id: 'l-2', quarry_id: 'q-2' },
      { id: 'l-3' },
    ],
    vehicles: [{ id: 'v-1', quarryId: 'q-1' }, { id: 'v-2', quarryId: 'q-2' }],
    rates: { first: 43, second: 33 },
    branding: { company: 'private company config' },
    billingConfig: { gst: 'private billing config' },
    activeQuarryId: 'q-2',
    theme: 'rz_gold',
  };
  const scoped = scopeStateForUser(state, { role: 'QUARRY_MANAGER', quarryIds: ['q-1'] }, 'q-2');

  assert.deepEqual(scoped.quarries, [{ id: 'q-1' }]);
  assert.deepEqual(scoped.loads, [{ id: 'l-1', quarryId: 'q-1' }]);
  assert.deepEqual(scoped.vehicles, [{ id: 'v-1', quarryId: 'q-1' }]);
  assert.equal(scoped.rates, null);
  assert.equal(scoped.branding, null);
  assert.equal(scoped.billingConfig, null);
  assert.equal(scoped.activeQuarryId, '');
  assert.equal(scoped.theme, 'rz_gold');
});

test('scoped state fails closed when a user has no quarry memberships', () => {
  const state = {
    quarries: [{ id: 'q-1' }],
    loads: [{ id: 'l-1', quarryId: 'q-1' }],
    vehicles: [{ id: 'v-1', quarryId: 'q-1' }],
    activeQuarryId: 'q-1',
  };
  const scoped = scopeStateForUser(state, { role: 'VIEWER', quarryIds: [] }, 'q-1');
  assert.deepEqual(scoped.quarries, []);
  assert.deepEqual(scoped.loads, []);
  assert.deepEqual(scoped.vehicles, []);
  assert.equal(scoped.activeQuarryId, '');
});

test('owner/admin state is not reduced by the scoped-state helper', () => {
  const state = { quarries: [{ id: 'q-1' }], rates: { first: 43 } };
  assert.equal(scopeStateForUser(state, { role: 'OWNER', quarryIds: [] }, 'q-1'), state);
  assert.equal(scopeStateForUser(state, { role: 'ADMIN', quarryIds: [] }, 'q-1'), state);
});

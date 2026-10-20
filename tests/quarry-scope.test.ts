import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessQuarry, rowQuarryId } from '../backend/security/quarry-scope.ts';

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

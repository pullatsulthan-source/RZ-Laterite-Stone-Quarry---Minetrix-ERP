import test from 'node:test';
import assert from 'node:assert/strict';
import { requireQuarryAccess, requireRole } from '../backend/middleware/auth.ts';

function makeResponse() {
  const res: any = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };
  return res;
}

function runMiddleware(middleware: any, req: any) {
  const res = makeResponse();
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test('quarry access rejects unauthenticated requests', () => {
  const { res, nextCalled } = runMiddleware(requireQuarryAccess(), {
    params: { quarryId: 'q-1' }, body: {}, query: {},
  });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('quarry access requires a quarry id', () => {
  const { res, nextCalled } = runMiddleware(requireQuarryAccess(), {
    user: { uid: 'u-1', role: 'VIEWER', quarryIds: ['q-1'] },
    params: {}, body: {}, query: {},
  });
  assert.equal(res.statusCode, 422);
  assert.equal(nextCalled, false);
});

test('quarry access rejects users outside the requested quarry', () => {
  const { res, nextCalled } = runMiddleware(requireQuarryAccess(), {
    user: { uid: 'u-1', role: 'QUARRY_MANAGER', quarryIds: ['q-1'] },
    params: { quarryId: 'q-2' }, body: {}, query: {},
  });
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('quarry access permits a user assigned to the requested quarry', () => {
  const { res, nextCalled } = runMiddleware(requireQuarryAccess(), {
    user: { uid: 'u-1', role: 'QUARRY_MANAGER', quarryIds: ['q-1'] },
    params: { quarryId: 'q-1' }, body: {}, query: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});

test('quarry access permits OWNER role', () => {
  const { res, nextCalled } = runMiddleware(requireQuarryAccess(), {
    user: { uid: 'u-1', role: 'OWNER', quarryIds: [] },
    params: { quarryId: 'q-2' }, body: {}, query: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});

test('role guard rejects a role outside the allow-list', () => {
  const { res, nextCalled } = runMiddleware(requireRole(['OWNER', 'ADMIN']), {
    user: { uid: 'u-1', role: 'VIEWER', quarryIds: [] },
    params: {}, body: {}, query: {},
  });
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('role guard permits an allowed role', () => {
  const { res, nextCalled } = runMiddleware(requireRole(['OWNER', 'ADMIN']), {
    user: { uid: 'u-1', role: 'ADMIN', quarryIds: [] },
    params: {}, body: {}, query: {},
  });
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});

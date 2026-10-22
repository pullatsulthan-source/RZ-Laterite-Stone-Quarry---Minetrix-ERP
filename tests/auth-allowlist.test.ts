import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedFirebaseIdentity, parseAllowedEmails } from '../backend/middleware/auth-allowlist.ts';

const pair = 'Nafid@Example.com,aflah@example.com';

test('accepts exactly two unique allowlist addresses and normalizes case', () => {
  assert.deepEqual(parseAllowedEmails(pair), ['nafid@example.com', 'aflah@example.com']);
  assert.equal(isAllowedFirebaseIdentity('NAFID@example.com', true, pair), true);
});

test('fails closed when the allowlist is unset or incomplete', () => {
  assert.deepEqual(parseAllowedEmails(undefined), []);
  assert.equal(isAllowedFirebaseIdentity('nafid@example.com', true, undefined), false);
  assert.equal(isAllowedFirebaseIdentity('nafid@example.com', true, 'nafid@example.com'), false);
});

test('fails closed when allowlist contains duplicates or malformed addresses', () => {
  assert.equal(isAllowedFirebaseIdentity('nafid@example.com', true, 'nafid@example.com,NAFID@example.com'), false);
  assert.equal(isAllowedFirebaseIdentity('nafid@example.com', true, 'nafid@example.com,not-an-email'), false);
  assert.deepEqual(parseAllowedEmails('one@,two@example.com'), []);
  assert.deepEqual(parseAllowedEmails('one@example.com,two@'), []);
});

test('rejects an email that is not an exact allowlist member', () => {
  assert.equal(isAllowedFirebaseIdentity('nafid@example.com.evil.test', true, pair), false);
  assert.equal(isAllowedFirebaseIdentity('other@example.com', true, pair), false);
});

test('requires a verified email address', () => {
  assert.equal(isAllowedFirebaseIdentity('nafid@example.com', false, pair), false);
  assert.equal(isAllowedFirebaseIdentity(undefined, true, pair), false);
});

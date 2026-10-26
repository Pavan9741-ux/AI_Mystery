import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionMiddleware } from '../src/middleware/session.js';

test('new session credentials are signed and tampering is rejected', () => {
  const issuingRequest = { method: 'POST', path: '/sessions', get: () => undefined };
  sessionMiddleware(issuingRequest, {}, (error) => { if (error) throw error; });
  assert.match(issuingRequest.sessionId, /^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/);

  const validRequest = { method: 'GET', path: '/cases', get: () => issuingRequest.sessionId };
  sessionMiddleware(validRequest, {}, (error) => { if (error) throw error; });
  assert.equal(validRequest.sessionId, issuingRequest.sessionId);

  const tamperedRequest = { method: 'GET', path: '/cases', get: () => `${issuingRequest.sessionId.slice(0, -1)}x` };
  let rejected;
  sessionMiddleware(tamperedRequest, {}, (error) => { rejected = error; });
  assert.equal(rejected.code, 'SESSION_UNAUTHORIZED');
});

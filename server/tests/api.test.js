import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

let server;
let baseUrl;
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(async () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test('health readiness and signed anonymous session flow work without a database', async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 503);
  assert.equal((await health.json()).status, 'unavailable');

  const created = await fetch(`${baseUrl}/sessions`, { method:'POST' });
  assert.equal(created.status, 201);
  const { sessionId } = await created.json();
  const protectedRoute = await fetch(`${baseUrl}/not-a-route`, { headers:{ 'X-Session-Id':sessionId } });
  assert.equal(protectedRoute.status, 404);
  assert.equal((await protectedRoute.json()).error.code, 'NOT_FOUND');
});

test('case routes reject missing session credentials in a standard error envelope', async () => {
  const response = await fetch(`${baseUrl}/cases`);
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, 'SESSION_UNAUTHORIZED');
});

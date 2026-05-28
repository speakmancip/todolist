/**
 * @file health.test.js
 * @description Phase 0 integration smoke test for the backend service.
 *
 * PURPOSE:
 * This test exists as the gate for Phase 0 of the build process. It must
 * pass before any feature code is written. It verifies two things:
 *  1. The Express app factory (createApp) initialises without throwing.
 *  2. The /health endpoint responds with the expected JSON payload.
 *
 * HOW IT WORKS:
 * supertest wraps the Express app and makes real HTTP requests through the
 * full middleware stack without binding a network port. This means the test
 * can run alongside other tests without port conflicts.
 *
 * WHAT IT DOES NOT TEST:
 * - Database connectivity (no DB is required by the skeleton app)
 * - Authentication or business logic
 * These concerns are covered by tests added in Phases 1–4.
 */

'use strict';

const request  = require('supertest');
const Database = require('better-sqlite3');
const { createApp } = require('../../src/app');

// JWT_SECRET must be set before createApp() is called because the full
// middleware stack (including authenticate) is wired in app.js.
process.env.JWT_SECRET = 'integration-test-secret';

describe('GET /health', () => {
  let app;

  beforeAll(() => {
    // Inject an in-memory database so the app factory can run migrations
    // and initialise repositories without touching the filesystem.
    const db = new Database(':memory:');
    app = createApp({ db });
  });

  it('returns HTTP 200 with status ok and the correct service name', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status:  'ok',
      service: 'todolist-backend',
    });
  });
});

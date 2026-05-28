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

const request = require('supertest');
const { createApp } = require('../../src/app');

describe('GET /health', () => {
  let app;

  beforeAll(() => {
    // Create the app once for all tests in this suite.
    // No database or environment variables are needed at this stage.
    app = createApp();
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

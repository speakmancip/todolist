/**
 * @file health.test.js
 * @description Phase 0 integration smoke test for the BFF service.
 *
 * PURPOSE:
 * This test exists as the gate for Phase 0 of the build process. It must
 * pass before any feature code is written. It verifies two things:
 *  1. The BFF Express app factory (createApp) initialises without throwing.
 *  2. The /health endpoint responds with the expected JSON payload.
 *
 * HOW IT WORKS:
 * supertest wraps the Express app and makes real HTTP requests through the
 * full middleware stack without binding a network port.
 *
 * WHAT IT DOES NOT TEST:
 * - Proxying to the backend (httpClient is not involved at this stage)
 * - Authentication or CORS enforcement
 * These are covered by integration tests added in Phase 5.
 */

'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');

describe('GET /health', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('returns HTTP 200 with status ok and the correct service name', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status:  'ok',
      service: 'todolist-bff',
    });
  });
});

/**
 * @file auth.test.js
 * @description Integration tests for the authentication endpoints.
 *
 * ARCHITECTURE — Integration Test / Interface Layer:
 * These tests exercise the full backend middleware stack — routing,
 * controllers, use cases, repositories, and the global error handler —
 * through real HTTP requests via supertest. They use an in-memory
 * SQLite database injected into the app factory so every suite starts
 * with a clean, isolated database without touching the filesystem.
 *
 * USE CASES COVERED:
 *   UC-01  POST /auth/login — happy path → 200 + JWT token
 *   UC-02  POST /auth/login — wrong password → 401, generic message
 *   UC-03  POST /auth/login — unknown email → 401, same message as UC-02
 *
 * ADDITIONAL COVERAGE:
 *   POST /auth/register — happy path → 201 + JWT token
 *   POST /auth/register — duplicate email → 409
 */

'use strict';

const request  = require('supertest');
const Database = require('better-sqlite3');
const { createApp } = require('../../src/app');

// The JWT_SECRET must be present before the app is created because the
// authenticate middleware reads it at verify-time, and the use cases read
// it at sign-time. A fixed test secret is safe here — it is only used
// inside the in-memory database that is destroyed when the process ends.
process.env.JWT_SECRET = 'integration-test-secret';

describe('Auth endpoints — POST /auth/register and POST /auth/login', () => {
  let app;

  // A fresh in-memory SQLite database is created for this suite only.
  // Migrations run inside createApp, so the schema is ready before any test.
  beforeAll(() => {
    const db = new Database(':memory:');
    app = createApp({ db });
  });

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  describe('POST /auth/register', () => {
    it('creates a new user account and returns HTTP 201 with a JWT token', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ emailAddress: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      // The token must be a non-empty string — format validation is the
      // responsibility of the authenticate middleware, not this test.
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('returns HTTP 409 when the email address is already registered', async () => {
      // Register the same address a second time — must be rejected.
      const response = await request(app)
        .post('/auth/register')
        .send({ emailAddress: 'alice@example.com', password: 'different-password' });

      expect(response.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // Login — UC-01, UC-02, UC-03
  // ---------------------------------------------------------------------------

  describe('POST /auth/login', () => {
    // Seed a known user before login tests run.
    // alice@example.com is already in the DB from the registration tests above
    // because all describe blocks share the same beforeAll database instance.

    it('UC-01: returns HTTP 200 and a JWT token for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ emailAddress: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('UC-02: returns HTTP 401 and a generic message for a wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ emailAddress: 'alice@example.com', password: 'wrong-password' });

      expect(response.status).toBe(401);
      // Exact message is required — this is the string shown to the user.
      expect(response.body.error).toBe('Incorrect credentials. Please try again');
    });

    it('UC-03: returns HTTP 401 and the same generic message for an unknown email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ emailAddress: 'nobody@example.com', password: 'secret123' });

      expect(response.status).toBe(401);
      // UC-02 and UC-03 must return the identical message so that an attacker
      // cannot determine which field was wrong (user enumeration prevention).
      expect(response.body.error).toBe('Incorrect credentials. Please try again');
    });
  });
});

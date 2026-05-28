/**
 * @file auth.test.js
 * @description Integration tests for the BFF authentication proxy endpoints.
 *
 * ARCHITECTURE — BFF Integration Test:
 * These tests verify that the BFF correctly proxies authentication requests to
 * the backend and returns the backend's response unmodified. The HTTP client
 * (httpClient.js) is mocked at the module level so no real backend is needed —
 * tests control exactly what the "backend" returns.
 *
 * WHAT IS TESTED:
 *   - POST /auth/register proxies the request body and returns the backend response
 *   - POST /auth/login proxies the request body and returns the backend response
 *   - UC-02 / UC-03: backend 401 responses are forwarded verbatim (no re-wrapping)
 *   - Backend unreachable: fetch TypeError → BFF returns 502
 *
 * WHAT IS NOT TESTED HERE:
 *   - JWT validity (the backend is responsible for that)
 *   - bcrypt password hashing (backend concern)
 *
 * jest.mock() is hoisted by Jest's transformer to before any require() calls,
 * so the mock is in place before createApp() loads the controllers.
 */

'use strict';

// Set env vars before any module is loaded — config.js reads them at import time.
process.env.BACKEND_URL = 'http://localhost:3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Replace the real HTTP client with a Jest mock so tests run without a backend.
jest.mock('../../src/httpClient');

const request            = require('supertest');
const { backendRequest } = require('../../src/httpClient');
const { createApp }      = require('../../src/app');

describe('BFF auth proxy — POST /auth/register and POST /auth/login', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  // Reset mock call history between tests so assertions are not polluted by
  // calls from previous tests.
  beforeEach(() => {
    backendRequest.mockReset();
  });

  // ---------------------------------------------------------------------------
  // POST /auth/register
  // ---------------------------------------------------------------------------

  describe('POST /auth/register', () => {
    it('forwards the request body to the backend and returns 201 with the token', async () => {
      const fakeToken = 'header.payload.signature';
      backendRequest.mockResolvedValue({ status: 201, body: { token: fakeToken } });

      const response = await request(app)
        .post('/auth/register')
        .send({ emailAddress: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ token: fakeToken });

      // Verify the BFF called the backend with the correct path and body.
      expect(backendRequest).toHaveBeenCalledTimes(1);
      expect(backendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path:   '/auth/register',
          body:   { emailAddress: 'alice@example.com', password: 'secret123' },
        })
      );
    });

    it('forwards a 409 Conflict response from the backend unchanged', async () => {
      backendRequest.mockResolvedValue({
        status: 409,
        body:   { error: 'An account with this email address already exists' },
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ emailAddress: 'existing@example.com', password: 'secret123' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBeDefined();
    });

    it('returns 502 when the backend service is unreachable', async () => {
      // fetch throws TypeError when the TCP connection fails (ECONNREFUSED).
      backendRequest.mockRejectedValue(new TypeError('fetch failed'));

      const response = await request(app)
        .post('/auth/register')
        .send({ emailAddress: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Backend service is unreachable');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/login — UC-01, UC-02, UC-03
  // ---------------------------------------------------------------------------

  describe('POST /auth/login', () => {
    it('UC-01: forwards valid credentials and returns 200 with the token', async () => {
      const fakeToken = 'header.payload.signature';
      backendRequest.mockResolvedValue({ status: 200, body: { token: fakeToken } });

      const response = await request(app)
        .post('/auth/login')
        .send({ emailAddress: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: fakeToken });

      expect(backendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path:   '/auth/login',
          body:   { emailAddress: 'alice@example.com', password: 'secret123' },
        })
      );
    });

    it('UC-02 / UC-03: forwards the backend 401 response verbatim for bad credentials', async () => {
      // The backend returns the same message for wrong password AND unknown email
      // (user enumeration prevention). The BFF must not alter this response.
      backendRequest.mockResolvedValue({
        status: 401,
        body:   { error: 'Incorrect credentials. Please try again' },
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ emailAddress: 'nobody@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Incorrect credentials. Please try again');
    });

    it('returns 502 when the backend service is unreachable', async () => {
      backendRequest.mockRejectedValue(new TypeError('fetch failed'));

      const response = await request(app)
        .post('/auth/login')
        .send({ emailAddress: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Backend service is unreachable');
    });
  });
});

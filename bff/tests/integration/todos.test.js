/**
 * @file todos.test.js
 * @description Integration tests for the BFF Todo proxy endpoints.
 *
 * ARCHITECTURE — BFF Integration Test:
 * Verifies that the BFF correctly proxies Todo requests to the backend,
 * and — critically — that the Authorization header is forwarded on every
 * request so the backend can authenticate the user.
 *
 * WHAT IS TESTED:
 *   - POST /todos proxies the request body and Authorization header to backend
 *   - GET  /todos proxies the Authorization header to backend
 *   - Backend 4xx responses (401, 422) are forwarded verbatim
 *   - Backend unreachable → 502
 *   - Authorization header is forwarded exactly as received (no transformation)
 *
 * WHAT IS NOT TESTED HERE:
 *   - JWT validation (backend concern — authenticate middleware)
 *   - Domain validation (backend concern — Todo domain entity)
 */

'use strict';

process.env.BACKEND_URL = 'http://localhost:3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';

jest.mock('../../src/httpClient');

const request            = require('supertest');
const { backendRequest } = require('../../src/httpClient');
const { createApp }      = require('../../src/app');

const FAKE_TOKEN = 'Bearer header.payload.signature';

describe('BFF todo proxy — POST /todos and GET /todos', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    backendRequest.mockReset();
  });

  // ---------------------------------------------------------------------------
  // POST /todos
  // ---------------------------------------------------------------------------

  describe('POST /todos', () => {
    it('UC-04: forwards the request body and Authorization header, returns 201', async () => {
      const fakeTodo = {
        id:          'uuid-1',
        title:       'Buy groceries',
        description: 'Milk and bread',
        dueDate:     '2026-06-01',
        isCompleted: false,
        createdAt:   '2026-05-28T00:00:00.000Z',
        userId:      'user-uuid-1',
      };
      backendRequest.mockResolvedValue({ status: 201, body: fakeTodo });

      const response = await request(app)
        .post('/todos')
        .set('Authorization', FAKE_TOKEN)
        .send({ title: 'Buy groceries', description: 'Milk and bread', dueDate: '2026-06-01' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(fakeTodo);

      // The Authorization header must be forwarded verbatim — the backend uses it
      // to authenticate the user via its JWT middleware.
      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('POST');
      expect(callArgs.path).toBe('/todos');
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
      expect(callArgs.body).toEqual({
        title:       'Buy groceries',
        description: 'Milk and bread',
        dueDate:     '2026-06-01',
      });
    });

    it('UC-05: forwards a backend 422 validation error response verbatim', async () => {
      backendRequest.mockResolvedValue({
        status: 422,
        body:   { error: 'Missing Title, please ensure title field is completed' },
      });

      const response = await request(app)
        .post('/todos')
        .set('Authorization', FAKE_TOKEN)
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.error).toBe(
        'Missing Title, please ensure title field is completed'
      );
    });

    it('forwards a backend 401 when no Authorization header is sent', async () => {
      backendRequest.mockResolvedValue({
        status: 401,
        body:   { error: 'Authorization token is required' },
      });

      const response = await request(app)
        .post('/todos')
        .send({ title: 'No token' });

      expect(response.status).toBe(401);
    });

    it('returns 502 when the backend service is unreachable', async () => {
      backendRequest.mockRejectedValue(new TypeError('fetch failed'));

      const response = await request(app)
        .post('/todos')
        .set('Authorization', FAKE_TOKEN)
        .send({ title: 'Test' });

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Backend service is unreachable');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /todos
  // ---------------------------------------------------------------------------

  describe('GET /todos', () => {
    it('forwards the Authorization header and returns the backend todo array', async () => {
      const fakeTodos = [
        { id: 'uuid-1', title: 'Buy groceries', isCompleted: false },
        { id: 'uuid-2', title: 'Walk the dog',  isCompleted: true  },
      ];
      backendRequest.mockResolvedValue({ status: 200, body: fakeTodos });

      const response = await request(app)
        .get('/todos')
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(fakeTodos);

      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('GET');
      expect(callArgs.path).toBe('/todos');
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
    });

    it('forwards a backend 401 when no Authorization header is sent', async () => {
      backendRequest.mockResolvedValue({
        status: 401,
        body:   { error: 'Authorization token is required' },
      });

      const response = await request(app).get('/todos');

      expect(response.status).toBe(401);
    });

    it('returns 502 when the backend service is unreachable', async () => {
      backendRequest.mockRejectedValue(new TypeError('fetch failed'));

      const response = await request(app)
        .get('/todos')
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Backend service is unreachable');
    });
  });
});

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
 *   - POST   /todos        proxies body + Authorization header
 *   - GET    /todos        proxies Authorization header
 *   - GET    /todos/:id    proxies to correct backend path (UC-06)
 *   - PUT    /todos/:id    proxies body + Authorization header (UC-07/08)
 *   - DELETE /todos/:id    proxies and returns 204 with no body (UC-09)
 *   - PATCH  /todos/:id/complete    proxies and returns 200
 *   - PATCH  /todos/:id/incomplete  proxies and returns 200
 *   - Backend 4xx responses (401, 422, 403, 404) are forwarded verbatim
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
const TODO_ID    = 'uuid-todo-1';

const fakeTodo = {
  id:          TODO_ID,
  title:       'Buy groceries',
  description: 'Milk and bread',
  dueDate:     '2026-06-01',
  isCompleted: false,
  createdAt:   '2026-05-28T00:00:00.000Z',
  userId:      'user-uuid-1',
};

describe('BFF todo proxy — all Todo endpoints', () => {
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

  // ---------------------------------------------------------------------------
  // GET /todos/:id — UC-06
  // ---------------------------------------------------------------------------

  describe('GET /todos/:id', () => {
    it('UC-06: forwards to /todos/:id with Authorization header, returns 200', async () => {
      backendRequest.mockResolvedValue({ status: 200, body: fakeTodo });

      const response = await request(app)
        .get(`/todos/${TODO_ID}`)
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(fakeTodo);

      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('GET');
      expect(callArgs.path).toBe(`/todos/${TODO_ID}`);
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
    });

    it('forwards a 404 from the backend verbatim', async () => {
      backendRequest.mockResolvedValue({ status: 404, body: { error: 'Todo not found' } });

      const response = await request(app)
        .get('/todos/non-existent')
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(404);
    });

    it('forwards a 403 from the backend verbatim', async () => {
      backendRequest.mockResolvedValue({ status: 403, body: { error: 'Access denied' } });

      const response = await request(app)
        .get(`/todos/${TODO_ID}`)
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /todos/:id — UC-07 / UC-08
  // ---------------------------------------------------------------------------

  describe('PUT /todos/:id', () => {
    it('UC-07: forwards body and Authorization header, returns 200 with updated todo', async () => {
      const updatedTodo = { ...fakeTodo, title: 'Updated title' };
      backendRequest.mockResolvedValue({ status: 200, body: updatedTodo });

      const response = await request(app)
        .put(`/todos/${TODO_ID}`)
        .set('Authorization', FAKE_TOKEN)
        .send({ title: 'Updated title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated title');

      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('PUT');
      expect(callArgs.path).toBe(`/todos/${TODO_ID}`);
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
      expect(callArgs.body).toEqual({ title: 'Updated title' });
    });

    it('UC-08: forwards a backend 422 for description > 1000 chars verbatim', async () => {
      backendRequest.mockResolvedValue({
        status: 422,
        body:   { error: 'Description too long, please reduce to 1000 characters' },
      });

      const response = await request(app)
        .put(`/todos/${TODO_ID}`)
        .set('Authorization', FAKE_TOKEN)
        .send({ description: 'x'.repeat(1001) });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe(
        'Description too long, please reduce to 1000 characters'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /todos/:id — UC-09
  // ---------------------------------------------------------------------------

  describe('DELETE /todos/:id', () => {
    it('UC-09: forwards Authorization header, returns 204 with no body', async () => {
      backendRequest.mockResolvedValue({ status: 204, body: null });

      const response = await request(app)
        .delete(`/todos/${TODO_ID}`)
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('DELETE');
      expect(callArgs.path).toBe(`/todos/${TODO_ID}`);
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
    });

    it('forwards a 403 from the backend verbatim', async () => {
      backendRequest.mockResolvedValue({ status: 403, body: { error: 'Access denied' } });

      const response = await request(app)
        .delete(`/todos/${TODO_ID}`)
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /todos/:id/complete and /incomplete
  // ---------------------------------------------------------------------------

  describe('PATCH /todos/:id/complete', () => {
    it('forwards Authorization header, returns 200 with isCompleted: true', async () => {
      backendRequest.mockResolvedValue({ status: 200, body: { ...fakeTodo, isCompleted: true } });

      const response = await request(app)
        .patch(`/todos/${TODO_ID}/complete`)
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body.isCompleted).toBe(true);

      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.path).toBe(`/todos/${TODO_ID}/complete`);
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
    });
  });

  describe('PATCH /todos/:id/incomplete', () => {
    it('forwards Authorization header, returns 200 with isCompleted: false', async () => {
      backendRequest.mockResolvedValue({ status: 200, body: { ...fakeTodo, isCompleted: false } });

      const response = await request(app)
        .patch(`/todos/${TODO_ID}/incomplete`)
        .set('Authorization', FAKE_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body.isCompleted).toBe(false);

      const callArgs = backendRequest.mock.calls[0][0];
      expect(callArgs.method).toBe('PATCH');
      expect(callArgs.path).toBe(`/todos/${TODO_ID}/incomplete`);
      expect(callArgs.headers.authorization).toBe(FAKE_TOKEN);
    });
  });
});

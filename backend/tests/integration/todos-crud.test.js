/**
 * @file todos-crud.test.js
 * @description Integration tests for the full Todo CRUD endpoints.
 *
 * USE CASES COVERED:
 *   UC-06  GET  /todos/:id             — fetch single todo
 *   UC-07  PUT  /todos/:id             — update fields, happy path
 *   UC-08  PUT  /todos/:id             — description > 1000 chars → 422
 *   UC-09  DELETE /todos/:id           — confirmed delete → 204
 *   PATCH  /todos/:id/complete         — mark completed → isCompleted: true
 *   PATCH  /todos/:id/incomplete       — mark incomplete → isCompleted: false
 *
 * GUARDS TESTED:
 *   GET/PUT/DELETE/PATCH without token → 401
 *   GET/PUT/DELETE/PATCH another user's todo → 403
 *   GET/PUT/DELETE/PATCH non-existent todo → 404
 */

'use strict';

const request  = require('supertest');
const Database = require('better-sqlite3');
const { createApp } = require('../../src/app');

process.env.JWT_SECRET = 'integration-test-secret';

async function registerAndGetToken(agent, emailAddress, password) {
  const res = await agent.post('/auth/register').send({ emailAddress, password });
  return res.body.token;
}

async function createTodo(agent, token, data) {
  const res = await agent
    .post('/todos')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
  return res.body;
}

describe('Todo CRUD endpoints — GET/PUT/DELETE/PATCH /todos/:id', () => {
  let app;
  let agent;
  let tokenAlice;
  let tokenBob;
  let aliceTodo;

  beforeAll(async () => {
    const db = new Database(':memory:');
    app   = createApp({ db });
    agent = request(app);

    tokenAlice = await registerAndGetToken(agent, 'alice@crud.com', 'pass-alice');
    tokenBob   = await registerAndGetToken(agent, 'bob@crud.com',   'pass-bob');

    // Seed a todo owned by Alice for use across tests.
    aliceTodo = await createTodo(agent, tokenAlice, {
      title:       'Alice original title',
      description: 'Original description',
      dueDate:     '2026-07-01',
    });
  });

  // ---------------------------------------------------------------------------
  // UC-06 — GET /todos/:id
  // ---------------------------------------------------------------------------

  describe('GET /todos/:id — UC-06: fetch single todo', () => {
    it('returns HTTP 200 with the full todo details', async () => {
      const response = await agent
        .get(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(aliceTodo.id);
      expect(response.body.title).toBe('Alice original title');
      expect(response.body.description).toBe('Original description');
      expect(response.body.dueDate).toBe('2026-07-01');
      expect(response.body.isCompleted).toBe(false);
    });

    it('returns HTTP 404 for a non-existent todo ID', async () => {
      const response = await agent
        .get('/todos/non-existent-id')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(404);
    });

    it('returns HTTP 403 when requesting another user\'s todo', async () => {
      const response = await agent
        .get(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(response.status).toBe(403);
    });

    it('returns HTTP 401 without a token', async () => {
      const response = await agent.get(`/todos/${aliceTodo.id}`);
      expect(response.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // UC-07 / UC-08 — PUT /todos/:id
  // ---------------------------------------------------------------------------

  describe('PUT /todos/:id — UC-07/UC-08: update todo', () => {
    it('UC-07: returns HTTP 200 with updated fields', async () => {
      const response = await agent
        .put(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: 'Updated title', description: 'Updated description', dueDate: '2026-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated title');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.dueDate).toBe('2026-12-31');
    });

    it('UC-08: returns HTTP 422 when description exceeds 1000 characters', async () => {
      const response = await agent
        .put(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: 'Valid', description: 'x'.repeat(1001) });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe(
        'Description too long, please reduce to 1000 characters'
      );
    });

    it('returns HTTP 403 when updating another user\'s todo', async () => {
      const response = await agent
        .put(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ title: 'Bob trying to edit' });

      expect(response.status).toBe(403);
    });

    it('returns HTTP 404 for a non-existent todo', async () => {
      const response = await agent
        .put('/todos/does-not-exist')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: 'X' });

      expect(response.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /todos/:id/complete and /incomplete
  // ---------------------------------------------------------------------------

  describe('PATCH /todos/:id/complete and /incomplete', () => {
    it('marks a todo as completed and returns isCompleted: true', async () => {
      const response = await agent
        .patch(`/todos/${aliceTodo.id}/complete`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(200);
      expect(response.body.isCompleted).toBe(true);
    });

    it('marks a completed todo as incomplete and returns isCompleted: false', async () => {
      const response = await agent
        .patch(`/todos/${aliceTodo.id}/incomplete`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(200);
      expect(response.body.isCompleted).toBe(false);
    });

    it('returns HTTP 403 when patching another user\'s todo', async () => {
      const response = await agent
        .patch(`/todos/${aliceTodo.id}/complete`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(response.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // UC-09 — DELETE /todos/:id
  // ---------------------------------------------------------------------------

  describe('DELETE /todos/:id — UC-09: delete todo', () => {
    it('returns HTTP 403 when deleting another user\'s todo', async () => {
      const response = await agent
        .delete(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(response.status).toBe(403);
    });

    it('UC-09: returns HTTP 204 No Content on successful deletion', async () => {
      const response = await agent
        .delete(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it('returns HTTP 404 after the todo has been deleted', async () => {
      const response = await agent
        .get(`/todos/${aliceTodo.id}`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(404);
    });
  });
});

/**
 * @file todos.test.js
 * @description Integration tests for the Todo endpoints.
 *
 * ARCHITECTURE — Integration Test / Interface Layer:
 * These tests exercise the full backend middleware stack — JWT authentication,
 * routing, controllers, use cases, repositories, and the global error handler —
 * through real HTTP requests via supertest. An in-memory SQLite database is
 * injected via the app factory so the suite starts isolated and clean.
 *
 * USE CASES COVERED:
 *   UC-04  POST /todos — happy path → 201, isCompleted: false
 *   UC-05  POST /todos — missing title → 422, exact validation message
 *   UC-08  POST /todos — description > 1000 chars → 422, exact validation message
 *          (UC-08 is the edit variant but the domain validates on create too)
 *
 * ADDITIONAL COVERAGE:
 *   GET /todos — returns an array for the authenticated user
 *   GET /todos — returns an empty array when the user has no todos
 *   POST/GET /todos without token → 401
 *   User isolation — user A cannot see user B's todos
 */

'use strict';

const request  = require('supertest');
const Database = require('better-sqlite3');
const { createApp } = require('../../src/app');

process.env.JWT_SECRET = 'integration-test-secret';

// ---------------------------------------------------------------------------
// Helper — register a user and return the JWT token for that account.
// ---------------------------------------------------------------------------

/**
 * Registers a new user via the API and returns the JWT access token.
 *
 * @param {import('supertest').SuperTest} agent - Bound supertest agent.
 * @param {string} emailAddress
 * @param {string} password
 * @returns {Promise<string>} JWT token.
 */
async function registerAndGetToken(agent, emailAddress, password) {
  const response = await agent
    .post('/auth/register')
    .send({ emailAddress, password });

  if (response.status !== 201) {
    throw new Error(
      `Registration failed (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  return response.body.token;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Todo endpoints — POST /todos and GET /todos', () => {
  let app;
  let agent;
  let tokenAlice;
  let tokenBob;

  beforeAll(async () => {
    const db = new Database(':memory:');
    app   = createApp({ db });
    agent = request(app);

    // Seed two users so user-isolation tests have a second account available.
    tokenAlice = await registerAndGetToken(agent, 'alice@todos.com', 'pass-alice');
    tokenBob   = await registerAndGetToken(agent, 'bob@todos.com',   'pass-bob');
  });

  // ---------------------------------------------------------------------------
  // Authentication guard — requests without a token must be rejected
  // ---------------------------------------------------------------------------

  describe('Authentication guard', () => {
    it('returns HTTP 401 for POST /todos when no Authorization header is provided', async () => {
      const response = await agent
        .post('/todos')
        .send({ title: 'Unauthorised todo' });

      expect(response.status).toBe(401);
    });

    it('returns HTTP 401 for GET /todos when no Authorization header is provided', async () => {
      const response = await agent.get('/todos');

      expect(response.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // UC-04 — Create todo, happy path
  // ---------------------------------------------------------------------------

  describe('POST /todos — UC-04: create todo, happy path', () => {
    it('returns HTTP 201 with the new todo and isCompleted set to false', async () => {
      const response = await agent
        .post('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: 'Buy groceries', description: 'Milk and bread', dueDate: '2026-06-01' });

      expect(response.status).toBe(201);

      const todo = response.body;
      expect(todo).toHaveProperty('id');
      expect(todo.title).toBe('Buy groceries');
      expect(todo.description).toBe('Milk and bread');
      expect(todo.dueDate).toBe('2026-06-01');
      // isCompleted must default to false — the user has not completed it yet.
      expect(todo.isCompleted).toBe(false);
      expect(todo).toHaveProperty('createdAt');
    });

    it('creates a todo without an optional description or dueDate', async () => {
      const response = await agent
        .post('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: 'Title only' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Title only');
      expect(response.body.isCompleted).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // UC-05 — Create todo, missing title
  // ---------------------------------------------------------------------------

  describe('POST /todos — UC-05: create todo, missing title', () => {
    it('returns HTTP 422 with the exact validation message when title is absent', async () => {
      const response = await agent
        .post('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ description: 'No title provided' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe(
        'Missing Title, please ensure title field is completed'
      );
    });

    it('returns HTTP 422 when title is an empty string', async () => {
      const response = await agent
        .post('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: '   ' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe(
        'Missing Title, please ensure title field is completed'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // UC-08 — Description too long (domain validates on create as well as update)
  // ---------------------------------------------------------------------------

  describe('POST /todos — UC-08: description exceeds 1000 characters', () => {
    it('returns HTTP 422 with the exact validation message', async () => {
      // Generate a 1001-character description to trigger the domain rule.
      const longDescription = 'x'.repeat(1001);

      const response = await agent
        .post('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ title: 'Valid title', description: longDescription });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe(
        'Description too long, please reduce to 1000 characters'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GET /todos — list todos for authenticated user
  // ---------------------------------------------------------------------------

  describe('GET /todos — list todos', () => {
    it('returns HTTP 200 with an array containing the todos created by this user', async () => {
      const response = await agent
        .get('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Alice created two todos above (Buy groceries + Title only).
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('returns HTTP 200 with an empty array for a user who has no todos', async () => {
      // Bob has not created any todos.
      const response = await agent
        .get('/todos')
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // User isolation — each user only sees their own todos
  // ---------------------------------------------------------------------------

  describe('User isolation', () => {
    it("does not include another user's todos in the response", async () => {
      // Create a todo as Bob so both accounts have todos in the database.
      await agent
        .post('/todos')
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ title: 'Bob only todo' });

      // Alice's list must not contain Bob's todo.
      const aliceResponse = await agent
        .get('/todos')
        .set('Authorization', `Bearer ${tokenAlice}`);

      const aliceTodoTitles = aliceResponse.body.map((t) => t.title);
      expect(aliceTodoTitles).not.toContain("Bob only todo");

      // Bob's list must not contain Alice's todos.
      const bobResponse = await agent
        .get('/todos')
        .set('Authorization', `Bearer ${tokenBob}`);

      const bobTodoTitles = bobResponse.body.map((t) => t.title);
      expect(bobTodoTitles).not.toContain('Buy groceries');
      expect(bobTodoTitles).not.toContain('Title only');
    });
  });
});

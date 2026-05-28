/**
 * @file app.js
 * @description Express application factory for the BFF (Backend for Frontend).
 *
 * ARCHITECTURE — BFF Composition Root:
 * The BFF is a thin proxy that sits between the React SPA and the backend
 * service. This file wires together all BFF middleware and routes.
 *
 * Responsibilities:
 *  - Enforce CORS so only the configured SPA origin can make cross-origin requests
 *  - Parse incoming JSON bodies
 *  - Proxy /auth and /todos requests to the backend via the HTTP client
 *  - Forward the Authorization header verbatim on all /todos requests
 *  - Normalise network-level failures into 502 responses via the error handler
 *
 * The BFF does NOT:
 *  - Hold or validate JWTs — the backend is the sole JWT authority
 *  - Perform any domain logic (create, read, update, or delete Todos/Users)
 *  - Access the database directly
 *
 * Separating the app factory from server.js allows test suites to import
 * createApp() and use supertest without binding a real network port.
 * config.validate() is called from server.js, not here, so tests can run
 * without a full production environment.
 */

'use strict';

const express = require('express');
const cors    = require('cors');

const { CORS_ORIGIN }      = require('./config');
const { createAuthRoutes } = require('./routes/authRoutes');
const { createTodoRoutes } = require('./routes/todoRoutes');
const { errorHandler }     = require('./middleware/errorHandler');

/**
 * Creates and configures the BFF Express application.
 *
 * @returns {import('express').Application} A configured Express app instance
 *   that is ready to handle requests but has not yet started listening.
 */
function createApp() {
  const app = express();

  // Restrict cross-origin requests to the configured SPA origin.
  // Falls back to '*' when CORS_ORIGIN is not set (integration test environments).
  app.use(cors({ origin: CORS_ORIGIN || '*' }));

  // Parse incoming JSON request bodies.
  app.use(express.json());

  // Health check — public, no auth required.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'todolist-bff' });
  });

  // Auth proxy routes: POST /auth/register, POST /auth/login — public.
  app.use('/auth', createAuthRoutes());

  // Todo proxy routes: POST /todos, GET /todos — Authorization header forwarded inside controller.
  app.use('/todos', createTodoRoutes());

  // Global error handler — catches network failures from the HTTP client.
  // MUST be registered last so Express recognises the four-argument signature.
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

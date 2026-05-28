/**
 * @file app.js
 * @description Express application factory for the backend service.
 *
 * ARCHITECTURE — Interface Layer:
 * This file is the entry point to the Interface layer in the DDD structure.
 * It creates and configures the Express application without starting the HTTP
 * server — that responsibility belongs to server.js.
 *
 * Separating the app factory from the server entry point is a deliberate
 * design choice: test suites (using supertest) import createApp() directly
 * and make HTTP requests without binding a real network port.
 *
 * In the full implementation this factory will:
 *  - Connect to the SQLite database and run schema migrations
 *  - Instantiate repository implementations (Infrastructure layer)
 *  - Inject those repositories into use cases (Application layer)
 *  - Mount auth and todo routes with their dependencies resolved
 *  - Register the global error handler last (Express convention)
 */

'use strict';

const express = require('express');

/**
 * Creates and configures the Express application.
 *
 * @returns {import('express').Application} A configured Express app instance
 *   that is ready to handle requests but has not yet started listening.
 */
function createApp() {
  const app = express();

  // Parse incoming JSON request bodies.
  // All API endpoints in this service communicate via JSON.
  app.use(express.json());

  /**
   * Health check endpoint.
   *
   * Returns a simple JSON payload confirming the service is running.
   * Used by:
   *  - GCP Cloud Run / load balancers to determine instance readiness
   *  - The root-level `npm run validate` script during CI / local validation
   *  - The Phase 0 integration smoke test
   *
   * @route  GET /health
   * @access Public — no authentication required
   * @returns {{ status: 'ok', service: string }} 200 OK
   */
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'todolist-backend' });
  });

  return app;
}

module.exports = { createApp };

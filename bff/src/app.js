/**
 * @file app.js
 * @description Express application factory for the BFF (Backend for Frontend).
 *
 * ARCHITECTURE — BFF Layer:
 * The BFF is a thin proxy that sits between the React SPA and the backend
 * service. It has no business logic and no knowledge of domain models.
 *
 * Responsibilities of the BFF:
 *  - Accept requests from the SPA (enforcing CORS)
 *  - Forward the Authorization header verbatim to the backend
 *  - Return the backend's response to the SPA
 *  - Normalise error shapes into a consistent format for the frontend
 *
 * The BFF does NOT:
 *  - Hold or validate JWTs (the backend is the sole auth authority)
 *  - Perform any domain logic (create, read, update, or delete Todos/Users)
 *  - Access the database directly
 *
 * Separating the app factory from server.js allows test suites to import
 * createApp() and use supertest without binding a real network port.
 *
 * In the full implementation this factory will:
 *  - Apply CORS middleware with the configured allowed origin
 *  - Mount /auth and /todos proxy routes
 *  - Register the global error handler last
 */

'use strict';

const express = require('express');

/**
 * Creates and configures the BFF Express application.
 *
 * @returns {import('express').Application} A configured Express app instance
 *   that is ready to handle requests but has not yet started listening.
 */
function createApp() {
  const app = express();

  // Parse incoming JSON request bodies.
  app.use(express.json());

  /**
   * Health check endpoint.
   *
   * Confirms the BFF process is running and reachable.
   * Used by load balancers, orchestration platforms, and the validate script.
   *
   * @route  GET /health
   * @access Public — no authentication required
   * @returns {{ status: 'ok', service: string }} 200 OK
   */
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'todolist-bff' });
  });

  return app;
}

module.exports = { createApp };

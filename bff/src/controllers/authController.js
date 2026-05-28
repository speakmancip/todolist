/**
 * @file authController.js
 * @description HTTP controller for BFF authentication proxy endpoints.
 *
 * ARCHITECTURE — BFF Interface Layer:
 * BFF controllers are intentionally simpler than backend controllers. They
 * do not call use cases — they forward the request body to the backend and
 * pass the backend's status code and body straight back to the SPA.
 *
 * The BFF has no knowledge of domain models (User, Todo, LogEntry) and holds
 * no JWT secret. Any validation errors (4xx) or success responses (2xx) from
 * the backend are forwarded verbatim. The BFF only intervenes when the backend
 * is completely unreachable (network error → 502).
 *
 * AUTH ROUTES ARE PUBLIC — no Authorization header is forwarded here because
 * the SPA does not yet have a token when registering or logging in.
 */

'use strict';

const { backendRequest } = require('../httpClient');

/**
 * Creates BFF auth controller handlers.
 *
 * The factory pattern keeps the controller consistent with the backend and
 * makes it easy to swap the httpClient dependency in future if needed.
 *
 * @returns {{ register: Function, login: Function }}
 */
function createAuthController() {
  return {
    /**
     * POST /auth/register
     * Forwards the registration request to the backend and returns the JWT.
     *
     * @param {import('express').Request}  req - Body: { emailAddress, password }
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async register(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method: 'POST',
          path:   '/auth/register',
          body:   req.body,
        });
        res.status(status).json(body);
      } catch (error) {
        // fetch threw — backend is unreachable, pass to errorHandler.
        next(error);
      }
    },

    /**
     * POST /auth/login
     * Forwards the login request to the backend and returns the JWT.
     * Returns the backend's 401 response verbatim for UC-02 and UC-03.
     *
     * @param {import('express').Request}  req - Body: { emailAddress, password }
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async login(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method: 'POST',
          path:   '/auth/login',
          body:   req.body,
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createAuthController };

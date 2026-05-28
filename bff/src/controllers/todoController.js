/**
 * @file todoController.js
 * @description HTTP controller for BFF Todo proxy endpoints.
 *
 * ARCHITECTURE — BFF Interface Layer:
 * Proxies authenticated Todo requests to the backend. The Authorization header
 * is forwarded verbatim on every request so the backend can verify the JWT.
 *
 * SECURITY:
 * The BFF never validates, decodes, or stores the JWT. It simply copies the
 * Authorization header from the incoming SPA request to the outgoing backend
 * request. If the header is absent, the backend's authenticate middleware will
 * reject the request with 401 — the BFF does not duplicate that check.
 */

'use strict';

const { backendRequest } = require('../httpClient');

/**
 * Creates BFF todo controller handlers.
 *
 * @returns {{ create: Function, list: Function }}
 */
function createTodoController() {
  return {
    /**
     * POST /todos
     * Forwards the create-todo request to the backend with the JWT header.
     *
     * @param {import('express').Request}  req - Body: { title, description?, dueDate? }
     *   req.headers.authorization — Bearer token from the SPA.
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async create(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'POST',
          path:    '/todos',
          // Forward the Authorization header so the backend can authenticate the user.
          headers: { authorization: req.headers['authorization'] },
          body:    req.body,
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /todos
     * Forwards the list-todos request to the backend with the JWT header.
     *
     * @param {import('express').Request}  req - req.headers.authorization — Bearer token.
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async list(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'GET',
          path:    '/todos',
          headers: { authorization: req.headers['authorization'] },
          // GET requests carry no body.
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createTodoController };

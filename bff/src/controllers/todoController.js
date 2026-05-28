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
 *
 * HANDLER SUMMARY:
 *   create     POST   /todos
 *   list       GET    /todos
 *   getOne     GET    /todos/:id
 *   update     PUT    /todos/:id
 *   remove     DELETE /todos/:id
 *   complete   PATCH  /todos/:id/complete
 *   incomplete PATCH  /todos/:id/incomplete
 */

'use strict';

const { backendRequest } = require('../httpClient');

/**
 * Creates BFF todo controller handlers.
 *
 * @returns {object} Controller handler methods.
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

    /**
     * GET /todos/:id
     * Forwards a single-todo fetch to the backend (UC-06).
     *
     * @param {import('express').Request}  req - req.params.id, req.headers.authorization
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getOne(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'GET',
          path:    `/todos/${req.params.id}`,
          headers: { authorization: req.headers['authorization'] },
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PUT /todos/:id
     * Forwards a todo update to the backend (UC-07, UC-08).
     *
     * @param {import('express').Request}  req - Body: { title?, description?, dueDate? }
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async update(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'PUT',
          path:    `/todos/${req.params.id}`,
          headers: { authorization: req.headers['authorization'] },
          body:    req.body,
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },

    /**
     * DELETE /todos/:id
     * Forwards a todo deletion to the backend (UC-09).
     * The backend returns 204 No Content on success — no JSON body.
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async remove(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'DELETE',
          path:    `/todos/${req.params.id}`,
          headers: { authorization: req.headers['authorization'] },
        });
        // 204 responses have no body — send an empty response.
        if (status === 204) {
          res.status(204).end();
        } else {
          res.status(status).json(body);
        }
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /todos/:id/complete
     * Marks a todo as completed.
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async complete(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'PATCH',
          path:    `/todos/${req.params.id}/complete`,
          headers: { authorization: req.headers['authorization'] },
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /todos/:id/incomplete
     * Marks a completed todo as incomplete.
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async incomplete(req, res, next) {
      try {
        const { status, body } = await backendRequest({
          method:  'PATCH',
          path:    `/todos/${req.params.id}/incomplete`,
          headers: { authorization: req.headers['authorization'] },
        });
        res.status(status).json(body);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createTodoController };

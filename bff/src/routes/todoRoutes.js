/**
 * @file todoRoutes.js
 * @description Express router for BFF Todo proxy endpoints.
 *
 * ARCHITECTURE — BFF Interface Layer:
 * Mounted at /todos in app.js. The Authorization header forwarding is handled
 * inside the controller — the BFF does not have its own authenticate middleware
 * because it never validates JWTs. The backend is the sole JWT authority.
 *
 * Full paths (after mounting at /todos):
 *   POST   /todos                  — proxy create-todo to backend
 *   GET    /todos                  — proxy list-todos to backend
 *   GET    /todos/:id              — proxy fetch single todo (UC-06)
 *   PUT    /todos/:id              — proxy update todo (UC-07, UC-08)
 *   DELETE /todos/:id              — proxy delete todo (UC-09)
 *   PATCH  /todos/:id/complete     — proxy mark complete
 *   PATCH  /todos/:id/incomplete   — proxy mark incomplete
 */

'use strict';

const express = require('express');
const { createTodoController } = require('../controllers/todoController');

/**
 * Creates and returns the BFF todo Express router.
 *
 * @returns {import('express').Router}
 */
function createTodoRoutes() {
  const router     = express.Router();
  const controller = createTodoController();

  /** Proxy POST /todos to the backend (Authorization header forwarded). */
  router.post('/', (req, res, next) => controller.create(req, res, next));

  /** Proxy GET /todos to the backend (Authorization header forwarded). */
  router.get('/', (req, res, next) => controller.list(req, res, next));

  // Resource routes — specific sub-paths before the bare :id catch-all.
  router.patch('/:id/complete',   (req, res, next) => controller.complete(req, res, next));
  router.patch('/:id/incomplete', (req, res, next) => controller.incomplete(req, res, next));
  router.get('/:id',              (req, res, next) => controller.getOne(req, res, next));
  router.put('/:id',              (req, res, next) => controller.update(req, res, next));
  router.delete('/:id',           (req, res, next) => controller.remove(req, res, next));

  return router;
}

module.exports = { createTodoRoutes };

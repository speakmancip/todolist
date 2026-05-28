/**
 * @file todoRoutes.js
 * @description Express router for BFF Todo proxy endpoints.
 *
 * ARCHITECTURE — BFF Interface Layer:
 * Mounted at /todos in app.js. The Authorization header forwarding is handled
 * inside the controller — the BFF does not have its own authenticate middleware
 * because it never validates JWTs. The backend is the sole JWT authority.
 *
 * Full paths (after mounting):
 *   POST /todos  — proxy create-todo to backend
 *   GET  /todos  — proxy list-todos to backend
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

  return router;
}

module.exports = { createTodoRoutes };

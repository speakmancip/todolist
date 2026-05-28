/**
 * @file todoRoutes.js
 * @description Express router for Todo endpoints.
 *
 * ARCHITECTURE — Interface Layer:
 * Mounted at /todos in app.js. The authenticate middleware is applied at the
 * mount point in app.js, so every route in this router is protected — there
 * is no need to apply authenticate individually to each route here.
 *
 * Full paths (after mounting):
 *   POST /todos    — create a new Todo
 *   GET  /todos    — list all Todos for the authenticated user
 */

'use strict';

const express = require('express');
const { createTodoController } = require('../controllers/todoController');

/**
 * Creates and returns the todo Express router with dependencies injected.
 *
 * @param {object} deps - Dependencies forwarded to the controller factory.
 * @param {object} deps.todoRepository
 * @param {object} deps.logger
 * @returns {import('express').Router}
 */
function createTodoRoutes(deps) {
  const router     = express.Router();
  const controller = createTodoController(deps);

  /** Create a new Todo for the authenticated user. */
  router.post('/', (req, res, next) => controller.create(req, res, next));

  /** Return all Todos for the authenticated user. */
  router.get('/', (req, res, next) => controller.list(req, res, next));

  return router;
}

module.exports = { createTodoRoutes };

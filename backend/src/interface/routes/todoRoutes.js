/**
 * @file todoRoutes.js
 * @description Express router for Todo endpoints.
 *
 * ARCHITECTURE — Interface Layer:
 * Mounted at /todos in app.js. The authenticate middleware is applied at the
 * mount point, so every route here is protected — no per-route auth needed.
 *
 * Full paths (after mounting at /todos):
 *   POST   /todos                   — create a new Todo
 *   GET    /todos                   — list all Todos for the authenticated user
 *   GET    /todos/:id               — fetch a single Todo (UC-06)
 *   PUT    /todos/:id               — update title/description/dueDate (UC-07, UC-08)
 *   DELETE /todos/:id               — permanently delete (UC-09)
 *   PATCH  /todos/:id/complete      — mark as completed
 *   PATCH  /todos/:id/incomplete    — mark as incomplete
 */

'use strict';

const express = require('express');
const { createTodoController } = require('../controllers/todoController');

/**
 * Creates and returns the todo Express router with dependencies injected.
 *
 * @param {object} deps - Forwarded to the controller factory.
 * @param {object} deps.todoRepository
 * @param {object} deps.logger
 * @returns {import('express').Router}
 */
function createTodoRoutes(deps) {
  const router     = express.Router();
  const controller = createTodoController(deps);

  // Collection routes
  router.post('/',    (req, res, next) => controller.create(req, res, next));
  router.get('/',     (req, res, next) => controller.list(req, res, next));

  // Resource routes — :id must come after specific paths like /complete
  router.get('/:id',              (req, res, next) => controller.getOne(req, res, next));
  router.put('/:id',              (req, res, next) => controller.update(req, res, next));
  router.delete('/:id',           (req, res, next) => controller.remove(req, res, next));
  router.patch('/:id/complete',   (req, res, next) => controller.complete(req, res, next));
  router.patch('/:id/incomplete', (req, res, next) => controller.incomplete(req, res, next));

  return router;
}

module.exports = { createTodoRoutes };

/**
 * @file todoController.js
 * @description HTTP controller for Todo endpoints.
 *
 * ARCHITECTURE — Interface Layer:
 * Follows the same factory pattern as authController.js. Dependencies
 * (todoRepository, logger) are injected at startup by app.js.
 *
 * The authenticate middleware (applied at the router level) guarantees
 * that req.userId is populated before any controller method runs.
 * Controllers trust this value — they do not re-verify the token.
 */

'use strict';

const { createTodo } = require('../../application/todo/createTodo');
const { listTodos }  = require('../../application/todo/listTodos');

/**
 * Creates todo controller handlers with dependencies pre-bound.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @returns {{ create: Function, list: Function }}
 */
function createTodoController({ todoRepository, logger }) {
  return {
    /**
     * POST /todos
     * Creates a new Todo for the authenticated user.
     *
     * @param {import('express').Request} req - Body: { title, description?, dueDate? }
     *   req.userId is set by the authenticate middleware.
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async create(req, res, next) {
      try {
        const { title, description, dueDate } = req.body;
        const todo = await createTodo(
          { todoRepository, logger },
          { title, description, dueDate, userId: req.userId }
        );
        res.status(201).json(todo);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /todos
     * Returns all Todos belonging to the authenticated user, newest first.
     *
     * @param {import('express').Request} req - req.userId set by authenticate middleware.
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async list(req, res, next) {
      try {
        const todos = await listTodos(
          { todoRepository },
          { userId: req.userId }
        );
        res.status(200).json(todos);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createTodoController };

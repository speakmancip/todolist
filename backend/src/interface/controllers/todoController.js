/**
 * @file todoController.js
 * @description HTTP controller for Todo endpoints.
 *
 * ARCHITECTURE — Interface Layer:
 * Follows the same factory pattern as authController.js. Dependencies
 * (todoRepository, logger) are injected at startup by app.js.
 *
 * The authenticate middleware (applied at the router mount point) guarantees
 * that req.userId is populated before any controller method runs.
 * Controllers trust this value — they do not re-verify the token.
 *
 * HANDLER SUMMARY:
 *   create    POST /todos
 *   list      GET  /todos
 *   getOne    GET  /todos/:id
 *   update    PUT  /todos/:id
 *   remove    DELETE /todos/:id      (returns 204 No Content)
 *   complete  PATCH /todos/:id/complete
 *   incomplete PATCH /todos/:id/incomplete
 */

'use strict';

const { createTodo }     = require('../../application/todo/createTodo');
const { listTodos }      = require('../../application/todo/listTodos');
const { getTodo }        = require('../../application/todo/getTodo');
const { updateTodo }     = require('../../application/todo/updateTodo');
const { deleteTodo }     = require('../../application/todo/deleteTodo');
const { completeTodo }   = require('../../application/todo/completeTodo');
const { incompleteTodo } = require('../../application/todo/incompleteTodo');

/**
 * Creates todo controller handlers with dependencies pre-bound.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @returns {object} Controller handler methods.
 */
function createTodoController({ todoRepository, logger }) {
  return {
    /**
     * POST /todos
     * Creates a new Todo for the authenticated user.
     *
     * @param {import('express').Request}  req - Body: { title, description?, dueDate? }
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
     * @param {import('express').Request}  req
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

    /**
     * GET /todos/:id
     * Returns a single Todo owned by the authenticated user (UC-06).
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getOne(req, res, next) {
      try {
        const todo = await getTodo(
          { todoRepository },
          { id: req.params.id, userId: req.userId }
        );
        res.status(200).json(todo);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PUT /todos/:id
     * Updates the mutable fields of a Todo (UC-07, UC-08).
     *
     * @param {import('express').Request}  req - Body: { title?, description?, dueDate? }
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async update(req, res, next) {
      try {
        const { title, description, dueDate } = req.body;
        const todo = await updateTodo(
          { todoRepository, logger },
          { id: req.params.id, userId: req.userId, title, description, dueDate }
        );
        res.status(200).json(todo);
      } catch (error) {
        next(error);
      }
    },

    /**
     * DELETE /todos/:id
     * Permanently deletes a Todo (UC-09). Returns 204 No Content on success.
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async remove(req, res, next) {
      try {
        await deleteTodo(
          { todoRepository, logger },
          { id: req.params.id, userId: req.userId }
        );
        // 204 No Content — the resource no longer exists, no body is needed.
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /todos/:id/complete
     * Marks a Todo as completed.
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async complete(req, res, next) {
      try {
        const todo = await completeTodo(
          { todoRepository, logger },
          { id: req.params.id, userId: req.userId }
        );
        res.status(200).json(todo);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /todos/:id/incomplete
     * Marks a completed Todo as incomplete.
     *
     * @param {import('express').Request}  req - req.params.id
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async incomplete(req, res, next) {
      try {
        const todo = await incompleteTodo(
          { todoRepository, logger },
          { id: req.params.id, userId: req.userId }
        );
        res.status(200).json(todo);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createTodoController };

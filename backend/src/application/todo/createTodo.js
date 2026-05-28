/**
 * @file createTodo.js
 * @description Use case: create a new Todo item for the authenticated user.
 *
 * ARCHITECTURE — Application Layer:
 * Orchestrates the creation of a Todo by:
 *  1. Delegating to the domain factory (which enforces all invariants).
 *  2. Persisting via the repository interface.
 *  3. Logging the event.
 *
 * Domain validation errors (missing title, description too long) propagate
 * naturally from createTodo() and are caught by the interface layer's
 * error handler, which maps them to HTTP 422 responses.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
// Alias the domain factory to avoid a name collision with this use case function.
const { createTodo: createTodoEntity } = require('../../domain/todo/Todo');

/**
 * Creates a new Todo item and persists it for the given user.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger - Implements logger.log().
 * @param {object} params - Input data.
 * @param {string} params.title - The todo title. Required.
 * @param {string} [params.description] - Optional longer description.
 * @param {string} [params.dueDate] - Optional due date (YYYY-MM-DD).
 * @param {string} params.userId - ID of the authenticated user creating the todo.
 *
 * @returns {Promise<Readonly<object>>} The newly created Todo entity.
 *
 * @throws {{ code: 'VALIDATION_ERROR', message: string }} If title is missing
 *   or description exceeds 1000 characters (thrown by domain factory).
 */
async function createTodo({ todoRepository, logger }, { title, description, dueDate, userId }) {
  // createTodoEntity (domain factory) will throw VALIDATION_ERROR if invariants are violated.
  const todo = createTodoEntity({
    id:        uuidv4(),
    title,
    description,
    dueDate,
    createdAt: new Date().toISOString(),
    userId,
  });

  await todoRepository.save(todo);

  await logger.log({
    userId,
    action:  'TODO_CREATED',
    message: `Todo created: "${todo.title}" (id: ${todo.id})`,
  });

  return todo;
}

module.exports = { createTodo };

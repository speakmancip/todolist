/**
 * @file completeTodo.js
 * @description Use case: mark a Todo as completed.
 *
 * ARCHITECTURE — Application Layer:
 * Applies the pure domain function completeTodo() to the fetched entity and
 * persists the result. Keeping the state-change logic in the domain layer
 * means the use case is only responsible for I/O and ownership checks.
 *
 * Uses PATCH /todos/:id/complete — a dedicated endpoint is cleaner than a
 * generic PUT because it produces a more specific audit log entry and makes
 * the caller's intent explicit.
 */

'use strict';

const { completeTodo: completeTodoDomain } = require('../../domain/todo/Todo');

/**
 * Marks a Todo as completed.
 *
 * @param {object} deps
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @param {object} input
 * @param {string} input.id     - UUID of the Todo.
 * @param {string} input.userId - Authenticated user's ID (from JWT).
 *
 * @returns {Promise<Readonly<object>>} The updated Todo with isCompleted: true.
 * @throws {{ code: 'NOT_FOUND' }} If no Todo exists with the given ID.
 * @throws {{ code: 'FORBIDDEN' }} If the Todo belongs to a different user.
 */
async function completeTodo({ todoRepository, logger }, { id, userId }) {
  const existing = await todoRepository.findById(id);

  if (!existing) {
    throw { code: 'NOT_FOUND', message: 'Todo not found' };
  }

  if (existing.userId !== userId) {
    throw { code: 'FORBIDDEN', message: 'Access denied' };
  }

  // Pure domain function returns a new frozen object — no mutation.
  const completed = completeTodoDomain(existing);

  await todoRepository.update(completed);
  await logger.log({
    userId,
    action:  'TODO_COMPLETED',
    message: `Todo completed: "${completed.title}" (id: ${id})`,
  });

  return completed;
}

module.exports = { completeTodo };

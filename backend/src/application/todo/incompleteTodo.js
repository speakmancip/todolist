/**
 * @file incompleteTodo.js
 * @description Use case: mark a Todo as incomplete (revert a completed Todo).
 *
 * ARCHITECTURE — Application Layer:
 * Mirror of completeTodo.js — applies the pure domain incompleteTodo()
 * function and persists the result. Separate PATCH endpoints for complete
 * and incomplete keep the audit log entries unambiguous.
 */

'use strict';

const { incompleteTodo: incompleteTodoDomain } = require('../../domain/todo/Todo');

/**
 * Marks a completed Todo as incomplete.
 *
 * @param {object} deps
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @param {object} input
 * @param {string} input.id     - UUID of the Todo.
 * @param {string} input.userId - Authenticated user's ID (from JWT).
 *
 * @returns {Promise<Readonly<object>>} The updated Todo with isCompleted: false.
 * @throws {{ code: 'NOT_FOUND' }} If no Todo exists with the given ID.
 * @throws {{ code: 'FORBIDDEN' }} If the Todo belongs to a different user.
 */
async function incompleteTodo({ todoRepository, logger }, { id, userId }) {
  const existing = await todoRepository.findById(id);

  if (!existing) {
    throw { code: 'NOT_FOUND', message: 'Todo not found' };
  }

  if (existing.userId !== userId) {
    throw { code: 'FORBIDDEN', message: 'Access denied' };
  }

  const incompleted = incompleteTodoDomain(existing);

  await todoRepository.update(incompleted);
  await logger.log({
    userId,
    action:  'TODO_INCOMPLETED',
    message: `Todo marked incomplete: "${incompleted.title}" (id: ${id})`,
  });

  return incompleted;
}

module.exports = { incompleteTodo };

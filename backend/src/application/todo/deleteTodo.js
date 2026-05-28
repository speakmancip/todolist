/**
 * @file deleteTodo.js
 * @description Use case: permanently delete a Todo (UC-09).
 *
 * ARCHITECTURE — Application Layer:
 * Fetches the Todo, checks ownership, then deletes it. Returns void on success
 * so the controller can respond with 204 No Content.
 */

'use strict';

/**
 * Permanently deletes a Todo owned by the authenticated user.
 *
 * @param {object} deps
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @param {object} input
 * @param {string} input.id     - UUID of the Todo to delete.
 * @param {string} input.userId - Authenticated user's ID (from JWT).
 *
 * @returns {Promise<void>}
 * @throws {{ code: 'NOT_FOUND' }} If no Todo exists with the given ID.
 * @throws {{ code: 'FORBIDDEN' }} If the Todo belongs to a different user.
 */
async function deleteTodo({ todoRepository, logger }, { id, userId }) {
  const existing = await todoRepository.findById(id);

  if (!existing) {
    throw { code: 'NOT_FOUND', message: 'Todo not found' };
  }

  if (existing.userId !== userId) {
    throw { code: 'FORBIDDEN', message: 'Access denied' };
  }

  await todoRepository.delete(id);
  await logger.log({
    userId,
    action:  'TODO_DELETED',
    message: `Todo deleted: "${existing.title}" (id: ${id})`,
  });
}

module.exports = { deleteTodo };

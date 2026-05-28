/**
 * @file getTodo.js
 * @description Use case: retrieve a single Todo by ID (UC-06).
 *
 * ARCHITECTURE — Application Layer:
 * Fetches a Todo by ID and asserts ownership. Returns 404 when the Todo does
 * not exist and 403 when it belongs to a different user — this prevents a
 * logged-in user from reading another user's todos by guessing UUIDs.
 */

'use strict';

/**
 * Retrieves a single Todo that belongs to the authenticated user.
 *
 * @param {object} deps
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} input
 * @param {string} input.id     - UUID of the Todo to fetch.
 * @param {string} input.userId - ID of the authenticated user (from JWT).
 *
 * @returns {Promise<Readonly<object>>} The matching Todo entity.
 * @throws {{ code: 'NOT_FOUND' }}  If no Todo exists with the given ID.
 * @throws {{ code: 'FORBIDDEN' }}  If the Todo belongs to a different user.
 */
async function getTodo({ todoRepository }, { id, userId }) {
  const todo = await todoRepository.findById(id);

  if (!todo) {
    throw { code: 'NOT_FOUND', message: 'Todo not found' };
  }

  // Return 403 rather than 404 when the todo exists but belongs to another
  // user — this preserves the security distinction between "doesn't exist"
  // and "exists but you don't have permission".
  if (todo.userId !== userId) {
    throw { code: 'FORBIDDEN', message: 'Access denied' };
  }

  return todo;
}

module.exports = { getTodo };

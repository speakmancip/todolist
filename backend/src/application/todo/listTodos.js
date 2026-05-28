/**
 * @file listTodos.js
 * @description Use case: retrieve all Todo items for the authenticated user.
 *
 * ARCHITECTURE — Application Layer:
 * The simplest use case in the slice — it delegates entirely to the repository
 * and returns the result. There is no domain logic to enforce here because
 * listing is a read operation with no invariants to check.
 *
 * Logging is intentionally omitted for list operations — read-only queries
 * do not constitute auditable events and logging them would create noise.
 */

'use strict';

/**
 * Returns all Todo items belonging to the authenticated user, newest first.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} params - Input data.
 * @param {string} params.userId - ID of the authenticated user.
 *
 * @returns {Promise<Readonly<object>[]>} Array of frozen Todo entities.
 */
async function listTodos({ todoRepository }, { userId }) {
  return todoRepository.findAllByUserId(userId);
}

module.exports = { listTodos };

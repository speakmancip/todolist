/**
 * @file updateTodo.js
 * @description Use case: update an existing Todo's mutable fields (UC-07, UC-08).
 *
 * ARCHITECTURE — Application Layer:
 * Fetches the existing Todo, checks ownership, then reconstructs it through
 * the domain factory so all validation rules (title required, description
 * ≤ 1000 chars) are re-enforced on the updated values.
 *
 * Partial updates are supported: only fields present in `input` are changed;
 * omitted fields keep their existing values.
 */

'use strict';

const { createTodo: createTodoEntity } = require('../../domain/todo/Todo');

/**
 * Updates the mutable fields of a Todo owned by the authenticated user.
 *
 * @param {object} deps
 * @param {object} deps.todoRepository - Implements TodoRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @param {object} input
 * @param {string}  input.id          - UUID of the Todo to update.
 * @param {string}  input.userId      - Authenticated user's ID (from JWT).
 * @param {string}  [input.title]       - New title (required if provided).
 * @param {string}  [input.description] - New description (max 1000 chars).
 * @param {string}  [input.dueDate]     - New due date (YYYY-MM-DD).
 *
 * @returns {Promise<Readonly<object>>} The updated Todo entity.
 * @throws {{ code: 'NOT_FOUND' }}       If no Todo exists with the given ID.
 * @throws {{ code: 'FORBIDDEN' }}       If the Todo belongs to a different user.
 * @throws {{ code: 'VALIDATION_ERROR'}} If title is empty or description > 1000 chars.
 */
async function updateTodo({ todoRepository, logger }, { id, userId, title, description, dueDate }) {
  const existing = await todoRepository.findById(id);

  if (!existing) {
    throw { code: 'NOT_FOUND', message: 'Todo not found' };
  }

  if (existing.userId !== userId) {
    throw { code: 'FORBIDDEN', message: 'Access denied' };
  }

  // Re-run validation through the domain factory — this ensures UC-07 and
  // UC-08 rules are enforced on every update, not just on creation.
  const updated = createTodoEntity({
    ...existing,
    title:       title       !== undefined ? title       : existing.title,
    description: description !== undefined ? description : existing.description,
    dueDate:     dueDate     !== undefined ? dueDate     : existing.dueDate,
  });

  await todoRepository.update(updated);
  await logger.log({
    userId,
    action:  'TODO_UPDATED',
    message: `Todo updated: "${updated.title}" (id: ${id})`,
  });

  return updated;
}

module.exports = { updateTodo };

/**
 * @file Todo.js
 * @description Todo entity for the domain layer.
 *
 * ARCHITECTURE — Domain Layer:
 * This file is pure JavaScript with zero dependencies on any framework,
 * database, or Node.js built-in module. The domain layer is the innermost
 * layer of the DDD structure — it must never import from application,
 * interface, or infrastructure layers.
 *
 * A Todo is the primary aggregate root of this application. All business
 * rules concerning a todo item live here:
 *  - title is required and must be a non-empty string
 *  - description is optional but must not exceed 1000 characters
 *  - isCompleted defaults to false on creation
 *
 * Entities are created via factory functions (not classes) and returned as
 * frozen plain objects. Freezing enforces immutability — any mutation must
 * go through a dedicated pure function (completeTodo / incompleteTodo) that
 * returns a new object, making state transitions explicit and traceable.
 */

'use strict';

/**
 * Error code used when a Todo factory or transition receives invalid input.
 * Caught by the interface layer's error handler and mapped to HTTP 422.
 *
 * @constant {string}
 */
const VALIDATION_ERROR = 'VALIDATION_ERROR';

/**
 * Creates a new Todo entity, enforcing all domain invariants.
 *
 * @param {object} params - The raw data for the new Todo.
 * @param {string} params.id - UUID that uniquely identifies this Todo.
 * @param {string} params.title - Short description of the task. Required.
 * @param {string} [params.description] - Longer explanation. Optional, max 1000 chars.
 * @param {string} [params.dueDate] - Due date in YYYY-MM-DD format. Optional.
 * @param {boolean} [params.isCompleted=false] - Completion flag. Defaults to false.
 * @param {string} params.createdAt - ISO 8601 timestamp of when the Todo was created.
 * @param {string} params.userId - ID of the User who owns this Todo.
 *
 * @returns {Readonly<object>} A frozen Todo entity object.
 *
 * @throws {{ code: string, message: string }} VALIDATION_ERROR if title is
 *   missing/empty or if description exceeds 1000 characters.
 */
function createTodo({ id, title, description, dueDate, isCompleted, createdAt, userId }) {
  // title is the only required field on a Todo — without it the item has no meaning.
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw { code: VALIDATION_ERROR, message: 'Missing Title, please ensure title field is completed' };
  }

  // description is optional, but if provided it must not exceed 1000 characters.
  if (description !== undefined && description !== null && description.length > 1000) {
    throw { code: VALIDATION_ERROR, message: 'Description too long, please reduce to 1000 characters' };
  }

  return Object.freeze({
    id,
    title:       title.trim(),
    description: description || null,
    dueDate:     dueDate || null,
    // Explicitly default to false so the caller never has to think about it.
    isCompleted: isCompleted === true ? true : false,
    createdAt,
    userId,
  });
}

/**
 * Returns a new Todo with isCompleted set to true.
 *
 * This is a pure function — it does not mutate the original Todo. The caller
 * is responsible for persisting the returned entity.
 *
 * @param {Readonly<object>} todo - An existing Todo entity.
 * @returns {Readonly<object>} A new frozen Todo with isCompleted: true.
 */
function completeTodo(todo) {
  return Object.freeze({ ...todo, isCompleted: true });
}

/**
 * Returns a new Todo with isCompleted set to false.
 *
 * This is a pure function — it does not mutate the original Todo. The caller
 * is responsible for persisting the returned entity.
 *
 * @param {Readonly<object>} todo - An existing Todo entity.
 * @returns {Readonly<object>} A new frozen Todo with isCompleted: false.
 */
function incompleteTodo(todo) {
  return Object.freeze({ ...todo, isCompleted: false });
}

module.exports = { createTodo, completeTodo, incompleteTodo, VALIDATION_ERROR };

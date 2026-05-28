/**
 * @file TodoRepository.js
 * @description Repository interface contract for the Todo entity.
 *
 * ARCHITECTURE — Domain Layer:
 * This file defines the interface that any Todo persistence mechanism must
 * implement. It contains no executable code — only JSDoc describing the
 * method signatures and expected behaviour.
 *
 * WHY AN INTERFACE IN JAVASCRIPT?
 * JavaScript has no formal interface construct. We express the contract via
 * JSDoc so that:
 *  1. The application layer can be written against this contract without
 *     knowing whether the backing store is SQLite, PostgreSQL, or an
 *     in-memory object.
 *  2. Developers reading the code have a single, authoritative description
 *     of what a repository must provide.
 *  3. Unit tests can create lightweight mock objects that satisfy the same
 *     contract using jest.fn().
 *
 * The concrete implementation lives in:
 *  infrastructure/repositories/SqliteTodoRepository.js
 */

'use strict';

/**
 * @interface TodoRepository
 *
 * All methods are async and return Promises, even though the SQLite
 * implementation uses synchronous better-sqlite3 under the hood. This keeps
 * the application layer agnostic about whether I/O is sync or async.
 */

/**
 * Persists a new Todo entity to the backing store.
 *
 * @function
 * @name TodoRepository#save
 * @param {Readonly<object>} todo - A frozen Todo entity created by createTodo().
 * @returns {Promise<Readonly<object>>} The saved Todo (identical to input for SQLite).
 */

/**
 * Retrieves all Todos belonging to a specific user.
 *
 * @function
 * @name TodoRepository#findAllByUserId
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<Readonly<object>[]>} Array of frozen Todo entities, newest first.
 */

/**
 * Retrieves a single Todo by its unique ID.
 *
 * @function
 * @name TodoRepository#findById
 * @param {string} id - The UUID of the Todo to retrieve.
 * @returns {Promise<Readonly<object>|null>} The Todo entity, or null if not found.
 */

/**
 * Persists changes to an existing Todo (title, description, dueDate, isCompleted).
 *
 * @function
 * @name TodoRepository#update
 * @param {Readonly<object>} todo - The updated Todo entity.
 * @returns {Promise<Readonly<object>>} The updated Todo.
 */

/**
 * Permanently removes a Todo from the backing store.
 *
 * @function
 * @name TodoRepository#delete
 * @param {string} id - The UUID of the Todo to delete.
 * @returns {Promise<void>}
 */

// This file intentionally exports nothing — it is a documentation contract only.
module.exports = {};

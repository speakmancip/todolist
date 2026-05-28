/**
 * @file todos.js
 * @description API functions for Todo endpoints.
 *
 * ARCHITECTURE — Frontend API Layer:
 * Thin wrappers around apiFetch for the /todos BFF routes. The JWT token
 * is passed as a parameter and injected into the Authorization header here
 * so that components do not need to know the header format.
 *
 * All functions are individually importable and mockable in tests:
 *   jest.mock('../../api/todos')
 */

import { apiFetch } from './client';

/**
 * Returns all Todos for the authenticated user.
 *
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<Array>} Array of Todo objects.
 * @throws {{ status: number, message: string }} On 401 or network error.
 */
async function listTodos(token) {
  return apiFetch('/todos', {
    headers: { authorization: `Bearer ${token}` },
  });
}

/**
 * Creates a new Todo for the authenticated user.
 *
 * @param {object} data
 * @param {string}  data.title        - Required. Non-empty string.
 * @param {string}  [data.description] - Optional. Max 1000 characters.
 * @param {string}  [data.dueDate]     - Optional. ISO date string (YYYY-MM-DD).
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<object>} The newly created Todo object.
 * @throws {{ status: 422, message: string }} On validation failure (UC-05, UC-08).
 * @throws {{ status: 401, message: string }} If the token is missing or invalid.
 */
async function createTodo({ title, description, dueDate }, token) {
  return apiFetch('/todos', {
    method:  'POST',
    headers: { authorization: `Bearer ${token}` },
    body:    { title, description, dueDate },
  });
}

export { listTodos, createTodo };

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

/**
 * Fetches a single Todo by ID (UC-06).
 *
 * @param {string} id    - The Todo's unique identifier.
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<object>} The Todo object.
 * @throws {{ status: 404, message: string }} If the todo does not exist.
 * @throws {{ status: 403, message: string }} If the todo belongs to another user.
 */
async function getTodo(id, token) {
  return apiFetch(`/todos/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

/**
 * Updates the mutable fields of a Todo (UC-07, UC-08).
 *
 * @param {string} id   - The Todo's unique identifier.
 * @param {object} data - Fields to update (any subset of title, description, dueDate).
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<object>} The updated Todo object.
 * @throws {{ status: 422, message: string }} If description exceeds 1000 chars (UC-08).
 * @throws {{ status: 404, message: string }} If the todo does not exist.
 * @throws {{ status: 403, message: string }} If the todo belongs to another user.
 */
async function updateTodo(id, data, token) {
  return apiFetch(`/todos/${id}`, {
    method:  'PUT',
    headers: { authorization: `Bearer ${token}` },
    body:    data,
  });
}

/**
 * Permanently deletes a Todo (UC-09).
 *
 * @param {string} id    - The Todo's unique identifier.
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<void>} Resolves on 204 No Content.
 * @throws {{ status: 404, message: string }} If the todo does not exist.
 * @throws {{ status: 403, message: string }} If the todo belongs to another user.
 */
async function deleteTodo(id, token) {
  return apiFetch(`/todos/${id}`, {
    method:  'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
}

/**
 * Marks a Todo as completed.
 *
 * @param {string} id    - The Todo's unique identifier.
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<object>} The updated Todo with isCompleted: true.
 */
async function completeTodo(id, token) {
  return apiFetch(`/todos/${id}/complete`, {
    method:  'PATCH',
    headers: { authorization: `Bearer ${token}` },
  });
}

/**
 * Marks a completed Todo as incomplete.
 *
 * @param {string} id    - The Todo's unique identifier.
 * @param {string} token - JWT access token from AuthContext.
 * @returns {Promise<object>} The updated Todo with isCompleted: false.
 */
async function incompleteTodo(id, token) {
  return apiFetch(`/todos/${id}/incomplete`, {
    method:  'PATCH',
    headers: { authorization: `Bearer ${token}` },
  });
}

export { listTodos, createTodo, getTodo, updateTodo, deleteTodo, completeTodo, incompleteTodo };

/**
 * @file auth.js
 * @description API functions for authentication endpoints.
 *
 * ARCHITECTURE — Frontend API Layer:
 * Thin wrappers around apiFetch that name the BFF auth routes. Components
 * import these functions directly — they never call apiFetch themselves.
 * This keeps the URL paths out of component code and makes mocking trivial
 * in tests (jest.mock('../../api/auth')).
 *
 * For Slice 1 only loginUser is used by the UI. registerUser is included
 * here so the API layer is complete and ready for a future Register page.
 */

import { apiFetch } from './client';

/**
 * Registers a new user account.
 *
 * @param {string} emailAddress
 * @param {string} password
 * @returns {Promise<{ token: string }>} JWT access token.
 * @throws {{ status: number, message: string }} On 409 Conflict or network error.
 */
async function registerUser(emailAddress, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body:   { emailAddress, password },
  });
}

/**
 * Logs in with an existing account.
 *
 * @param {string} emailAddress
 * @param {string} password
 * @returns {Promise<{ token: string }>} JWT access token.
 * @throws {{ status: 401, message: string }} On invalid credentials (UC-02, UC-03).
 */
async function loginUser(emailAddress, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body:   { emailAddress, password },
  });
}

export { registerUser, loginUser };

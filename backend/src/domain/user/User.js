/**
 * @file User.js
 * @description User entity for the domain layer.
 *
 * ARCHITECTURE — Domain Layer:
 * The User entity represents an authenticated account in the system. Like all
 * domain entities, it is created via a factory function and returned as a
 * frozen plain object. It has no knowledge of how it is stored or how the
 * password is hashed — those concerns belong to the infrastructure layer.
 *
 * Domain rules enforced here:
 *  - emailAddress is required (it is the unique identifier used to log in)
 *
 * NOTE ON PASSWORD STORAGE:
 * The User entity holds the password field as provided. When creating a new
 * User via the registerUser use case, the application layer is responsible
 * for hashing the password with bcryptjs BEFORE passing it to createUser().
 * The domain entity never performs hashing — that is an infrastructure detail.
 */

'use strict';

/**
 * Creates a new User entity, enforcing all domain invariants.
 *
 * @param {object} params - The raw data for the new User.
 * @param {string} params.userId - UUID that uniquely identifies this User.
 * @param {string} params.emailAddress - The user's email address. Required and unique.
 * @param {string} params.password - The user's hashed password. Never stored in plain text.
 * @param {string} params.createdAt - ISO 8601 timestamp of when the User was created.
 *
 * @returns {Readonly<object>} A frozen User entity object.
 *
 * @throws {{ code: string, message: string }} VALIDATION_ERROR if emailAddress
 *   is missing or empty.
 */
function createUser({ userId, emailAddress, password, createdAt }) {
  // emailAddress is the login identifier — the system cannot function without it.
  if (!emailAddress || typeof emailAddress !== 'string' || emailAddress.trim() === '') {
    throw { code: 'VALIDATION_ERROR', message: 'emailAddress is required' };
  }

  return Object.freeze({
    userId,
    emailAddress: emailAddress.trim().toLowerCase(),
    password,
    createdAt,
  });
}

module.exports = { createUser };

/**
 * @file UserRepository.js
 * @description Repository interface contract for the User entity.
 *
 * ARCHITECTURE — Domain Layer:
 * Defines the persistence interface that the application layer programs
 * against. No executable code — JSDoc contract only.
 *
 * The concrete implementation lives in:
 *  infrastructure/repositories/SqliteUserRepository.js
 */

'use strict';

/**
 * @interface UserRepository
 */

/**
 * Persists a new User entity to the backing store.
 *
 * @function
 * @name UserRepository#save
 * @param {Readonly<object>} user - A frozen User entity created by createUser().
 * @returns {Promise<Readonly<object>>} The saved User.
 */

/**
 * Finds a User by their email address.
 * Used during login to retrieve the record before comparing the password.
 *
 * @function
 * @name UserRepository#findByEmail
 * @param {string} emailAddress - The email address to search for (case-insensitive).
 * @returns {Promise<Readonly<object>|null>} The User entity, or null if not found.
 */

/**
 * Finds a User by their unique ID.
 * Used by the JWT authentication middleware to verify the token subject.
 *
 * @function
 * @name UserRepository#findById
 * @param {string} userId - The UUID of the User to retrieve.
 * @returns {Promise<Readonly<object>|null>} The User entity, or null if not found.
 */

module.exports = {};

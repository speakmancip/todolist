/**
 * @file registerUser.js
 * @description Use case: register a new user account.
 *
 * ARCHITECTURE — Application Layer:
 * Use cases are the heart of the application layer. Each use case is a single
 * exported async function that receives its dependencies as its first argument
 * (dependency injection via function parameters — no service locator or DI
 * container). This makes unit testing trivial: pass jest.fn() mocks as deps.
 *
 * This use case:
 *  1. Checks the email address is not already registered (CONFLICT if taken).
 *  2. Hashes the plain-text password using bcryptjs (infrastructure concern,
 *     but injected so the domain stays pure).
 *  3. Creates a User entity via the domain factory (enforces invariants).
 *  4. Persists the User via the repository interface.
 *  5. Signs and returns a JWT access token.
 *  6. Logs the event.
 */

'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { createUser } = require('../../domain/user/User');
const { createLogEntry } = require('../../domain/log/LogEntry');

/** Number of bcrypt salt rounds — higher = slower hash but more secure. */
const SALT_ROUNDS = 10;

/**
 * Registers a new user and returns a signed JWT access token.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.userRepository - Implements UserRepository interface.
 * @param {object} deps.logRepository - Implements LogRepository interface.
 * @param {object} deps.logger - Implements logger.log().
 * @param {object} params - Input data.
 * @param {string} params.emailAddress - The new user's email address.
 * @param {string} params.password - The plain-text password (will be hashed).
 *
 * @returns {Promise<{ token: string, userId: string, emailAddress: string }>}
 *
 * @throws {{ code: 'CONFLICT', message: string }} If the email is already registered.
 */
async function registerUser({ userRepository, logRepository, logger }, { emailAddress, password }) {
  // Check whether the email is already in use before doing any work.
  const existingUser = await userRepository.findByEmail(emailAddress);
  if (existingUser) {
    throw { code: 'CONFLICT', message: 'An account with this email address already exists' };
  }

  // Hash the password before creating the domain entity or touching the DB.
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = createUser({
    userId:       uuidv4(),
    emailAddress,
    password:     hashedPassword,
    createdAt:    new Date().toISOString(),
  });

  await userRepository.save(user);

  // Sign a JWT — the payload contains the userId so the authenticate middleware
  // can identify the user on every subsequent request without a DB lookup.
  const token = jwt.sign(
    { userId: user.userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  await logger.log({
    userId:  user.userId,
    action:  'USER_REGISTERED',
    message: `New user registered: ${user.emailAddress}`,
  });

  return { token, userId: user.userId, emailAddress: user.emailAddress };
}

module.exports = { registerUser };

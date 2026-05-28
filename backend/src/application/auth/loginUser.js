/**
 * @file loginUser.js
 * @description Use case: authenticate an existing user and return a JWT.
 *
 * ARCHITECTURE — Application Layer:
 * Follows the same dependency injection pattern as registerUser.js.
 *
 * SECURITY — Generic error message:
 * Both "email not found" and "wrong password" return the same error code and
 * message. This is intentional — revealing which field is incorrect would
 * allow an attacker to enumerate valid email addresses (UC-02, UC-03).
 *
 * This use case:
 *  1. Looks up the user by email address.
 *  2. Compares the provided password against the stored bcrypt hash.
 *  3. Returns the same UNAUTHORIZED error regardless of which check failed.
 *  4. Signs and returns a JWT access token on success.
 *  5. Logs the event.
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * The user-facing error message for any authentication failure.
 * Identical for wrong email and wrong password — no field hint is given.
 *
 * @constant {string}
 */
const AUTH_FAILURE_MESSAGE = 'Incorrect credentials. Please try again';

/**
 * Authenticates a user and returns a signed JWT access token.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.userRepository - Implements UserRepository interface.
 * @param {object} deps.logger - Implements logger.log().
 * @param {object} params - Input data.
 * @param {string} params.emailAddress - The user's email address.
 * @param {string} params.password - The plain-text password to verify.
 *
 * @returns {Promise<{ token: string, userId: string, emailAddress: string }>}
 *
 * @throws {{ code: 'UNAUTHORIZED', message: string }} If credentials are invalid.
 */
async function loginUser({ userRepository, logger }, { emailAddress, password }) {
  const user = await userRepository.findByEmail(emailAddress);

  // Use the same error for "not found" and "wrong password" to prevent
  // user enumeration (UC-02 and UC-03 must produce identical responses).
  if (!user) {
    throw { code: 'UNAUTHORIZED', message: AUTH_FAILURE_MESSAGE };
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw { code: 'UNAUTHORIZED', message: AUTH_FAILURE_MESSAGE };
  }

  const token = jwt.sign(
    { userId: user.userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  await logger.log({
    userId:  user.userId,
    action:  'USER_LOGIN',
    message: `User logged in: ${user.emailAddress}`,
  });

  return { token, userId: user.userId, emailAddress: user.emailAddress };
}

module.exports = { loginUser };

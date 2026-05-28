/**
 * @file authController.js
 * @description HTTP controller for authentication endpoints.
 *
 * ARCHITECTURE — Interface Layer:
 * Controllers are the bridge between the HTTP request/response cycle and
 * the application layer use cases. They are responsible for:
 *  1. Extracting input from the request (body, params, headers).
 *  2. Calling the appropriate use case with the extracted input.
 *  3. Sending the HTTP response with the correct status code.
 *  4. Forwarding any errors to the global error handler via next(err).
 *
 * Controllers contain NO business logic. If a controller is doing anything
 * beyond extracting, delegating, and responding — that logic belongs in a
 * use case or domain entity instead.
 *
 * This factory pattern allows the repositories and logger to be injected
 * at startup (in app.js), making the controller fully testable in isolation.
 */

'use strict';

const { registerUser } = require('../../application/auth/registerUser');
const { loginUser }    = require('../../application/auth/loginUser');

/**
 * Creates auth controller handlers with dependencies pre-bound.
 *
 * @param {object} deps - Injected dependencies.
 * @param {object} deps.userRepository - Implements UserRepository interface.
 * @param {object} deps.logRepository  - Implements LogRepository interface.
 * @param {object} deps.logger         - Structured logger instance.
 * @returns {{ register: Function, login: Function }}
 */
function createAuthController({ userRepository, logRepository, logger }) {
  return {
    /**
     * POST /auth/register
     * Creates a new user account and returns a JWT access token.
     *
     * @param {import('express').Request} req - Body: { emailAddress, password }
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async register(req, res, next) {
      try {
        const { emailAddress, password } = req.body;
        const result = await registerUser(
          { userRepository, logRepository, logger },
          { emailAddress, password }
        );
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /auth/login
     * Validates credentials and returns a JWT access token.
     * Returns HTTP 401 for both bad email and bad password (UC-02, UC-03).
     *
     * @param {import('express').Request} req - Body: { emailAddress, password }
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async login(req, res, next) {
      try {
        const { emailAddress, password } = req.body;
        const result = await loginUser(
          { userRepository, logger },
          { emailAddress, password }
        );
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createAuthController };

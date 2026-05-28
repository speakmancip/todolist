/**
 * @file authRoutes.js
 * @description Express router for authentication endpoints.
 *
 * ARCHITECTURE — Interface Layer:
 * Routes wire HTTP method + path combinations to controller handlers.
 * They contain no logic — their only job is to declare what URL patterns
 * the application responds to and which controller method handles each.
 *
 * Mounted at /auth in app.js, so the full paths are:
 *   POST /auth/register
 *   POST /auth/login
 */

'use strict';

const express = require('express');
const { createAuthController } = require('../controllers/authController');

/**
 * Creates and returns the auth Express router with dependencies injected.
 *
 * @param {object} deps - Dependencies forwarded to the controller factory.
 * @param {object} deps.userRepository
 * @param {object} deps.logRepository
 * @param {object} deps.logger
 * @returns {import('express').Router}
 */
function createAuthRoutes(deps) {
  const router     = express.Router();
  const controller = createAuthController(deps);

  /** Create a new user account and return a JWT. */
  router.post('/register', (req, res, next) => controller.register(req, res, next));

  /** Authenticate an existing user and return a JWT. */
  router.post('/login', (req, res, next) => controller.login(req, res, next));

  return router;
}

module.exports = { createAuthRoutes };

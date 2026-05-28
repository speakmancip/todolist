/**
 * @file authRoutes.js
 * @description Express router for BFF authentication proxy endpoints.
 *
 * ARCHITECTURE — BFF Interface Layer:
 * Mounted at /auth in app.js. Both routes are public — no authentication
 * middleware is applied here because the SPA calls these endpoints before
 * it has a token.
 *
 * Full paths (after mounting):
 *   POST /auth/register  — proxy user registration to backend
 *   POST /auth/login     — proxy login to backend
 */

'use strict';

const express = require('express');
const { createAuthController } = require('../controllers/authController');

/**
 * Creates and returns the BFF auth Express router.
 *
 * @returns {import('express').Router}
 */
function createAuthRoutes() {
  const router     = express.Router();
  const controller = createAuthController();

  /** Proxy POST /auth/register to the backend. */
  router.post('/register', (req, res, next) => controller.register(req, res, next));

  /** Proxy POST /auth/login to the backend. */
  router.post('/login', (req, res, next) => controller.login(req, res, next));

  return router;
}

module.exports = { createAuthRoutes };

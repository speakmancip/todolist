/**
 * @file app.js
 * @description Express application factory for the backend service.
 *
 * ARCHITECTURE — Interface Layer / Composition Root:
 * This file is the composition root of the backend service. It wires every
 * layer of the DDD stack together:
 *
 *   Infrastructure  →  repositories + logger
 *   Application     →  use cases (receive repos + logger via DI)
 *   Interface       →  controllers + routes (receive use-case deps via DI)
 *
 * The factory accepts an optional `db` parameter so that integration test
 * suites can inject a fresh `new Database(':memory:')` instance without
 * touching the filesystem or requiring module-isolation tricks.
 *
 * In production (called from server.js with no arguments) the singleton
 * connection from infrastructure/database/db.js is used automatically.
 *
 * IMPORTANT — app.js never calls app.listen().
 * That is the sole responsibility of server.js. Keeping these concerns
 * separate is what allows supertest to import the app in tests without
 * binding a real network port.
 */

'use strict';

const express = require('express');

const { runMigrations }              = require('./infrastructure/database/migrations');
const { createSqliteUserRepository } = require('./infrastructure/repositories/SqliteUserRepository');
const { createSqliteTodoRepository } = require('./infrastructure/repositories/SqliteTodoRepository');
const { createSqliteLogRepository }  = require('./infrastructure/repositories/SqliteLogRepository');
const { createLogger }               = require('./infrastructure/logging/logger');
const { authenticate }               = require('./interface/middleware/authenticate');
const { errorHandler }               = require('./interface/middleware/errorHandler');
const { createAuthRoutes }           = require('./interface/routes/authRoutes');
const { createTodoRoutes }           = require('./interface/routes/todoRoutes');

/**
 * Creates and configures the Express application.
 *
 * @param {object} [options={}] - Optional overrides.
 * @param {import('better-sqlite3').Database} [options.db] - Database connection
 *   to use instead of the production singleton. Pass `new Database(':memory:')`
 *   in integration tests for a clean, isolated database per suite.
 *
 * @returns {import('express').Application} Configured Express app — not yet listening.
 */
function createApp(options = {}) {
  // Use the injected test database if provided; otherwise load the singleton.
  // Required lazily so tests that pass their own db never trigger a file-based connection.
  const db = options.db || require('./infrastructure/database/db');

  // Apply schema — CREATE TABLE IF NOT EXISTS, safe to run on every startup.
  runMigrations(db);

  // -------------------------------------------------------------------------
  // Instantiate infrastructure — all repos share one connection and one WAL journal.
  // -------------------------------------------------------------------------
  const logRepository  = createSqliteLogRepository(db);
  const logger         = createLogger(logRepository);
  const userRepository = createSqliteUserRepository(db);
  const todoRepository = createSqliteTodoRepository(db);

  // -------------------------------------------------------------------------
  // Build the Express application.
  // -------------------------------------------------------------------------
  const app = express();

  app.use(express.json());

  // Health check — public, no auth required.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'todolist-backend' });
  });

  // Auth routes: POST /auth/register, POST /auth/login — public.
  app.use('/auth', createAuthRoutes({ userRepository, logRepository, logger }));

  // Todo routes: POST /todos, GET /todos — all protected by JWT.
  // authenticate is applied at the mount point so every route in todoRoutes is covered.
  app.use('/todos', authenticate, createTodoRoutes({ todoRepository, logger }));

  // Global error handler — MUST be registered last.
  // Express identifies error handlers by their four-argument signature.
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

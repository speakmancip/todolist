/**
 * @file jest.config.js
 * @description Jest configuration for the backend service.
 *
 * Tests are organised into two directories:
 *  - tests/unit/        — pure unit tests (no I/O, no network)
 *  - tests/integration/ — supertest tests against the full Express app
 *
 * The --runInBand flag (set in package.json scripts) ensures integration tests
 * run serially in a single process. This prevents port conflicts and ensures
 * each test suite gets a clean in-memory SQLite database.
 */

'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};

/**
 * @file jest.config.js
 * @description Jest configuration for the BFF service.
 *
 * BFF tests live in tests/integration/ and use supertest against the Express
 * app factory. The HTTP client (httpClient.js) is mocked at the module level
 * so tests run without a real backend service.
 *
 * The --runInBand flag (set in package.json scripts) runs tests serially
 * to avoid port conflicts between test suites.
 */

'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};

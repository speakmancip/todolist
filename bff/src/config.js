/**
 * @file config.js
 * @description Environment variable configuration for the BFF service.
 *
 * ARCHITECTURE — BFF Configuration:
 * All environment variables are read and exported from this single file,
 * following 12-Factor III — Config. This is the only place in the BFF that
 * reads from process.env, making it easy to audit what configuration the
 * service requires.
 *
 * validate() is called from server.js at startup. It is NOT called inside
 * createApp() so that integration test suites can import the app without
 * providing a full production environment — tests set the env vars they
 * need and mock the HTTP client so BACKEND_URL is never actually used.
 *
 * Required variables:
 *   BACKEND_URL  — Base URL of the backend service (e.g. http://localhost:3001)
 *   CORS_ORIGIN  — Allowed origin for CORS requests (e.g. http://localhost:5173)
 *
 * Optional variables:
 *   PORT         — HTTP port the BFF listens on (default: 3002)
 */

'use strict';

const BACKEND_URL = process.env.BACKEND_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const PORT        = process.env.PORT || 3002;

/**
 * Validates that all required environment variables are present.
 * Must be called from server.js before app.listen() — not from createApp().
 *
 * @throws {Error} If any required variable is absent.
 */
function validate() {
  const missing = [];
  if (!BACKEND_URL) missing.push('BACKEND_URL');
  if (!CORS_ORIGIN) missing.push('CORS_ORIGIN');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { BACKEND_URL, CORS_ORIGIN, PORT, validate };

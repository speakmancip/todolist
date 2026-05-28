/**
 * @file errorHandler.js
 * @description Global error handler middleware for the BFF service.
 *
 * ARCHITECTURE — BFF Interface Layer:
 * This middleware is registered last in app.js so it catches any error
 * forwarded via next(err) from BFF controllers. Its primary job is to
 * handle network-level failures when the backend service is unreachable.
 *
 * Normal backend error responses (4xx, 5xx) are NOT errors from the BFF's
 * perspective — controllers forward those status codes and bodies directly
 * to the SPA without calling next(). This handler only fires when:
 *
 *   1. fetch() throws a TypeError (backend unreachable / ECONNREFUSED).
 *   2. An unexpected JavaScript error escapes a controller try/catch.
 *
 * The four-argument signature (err, req, res, next) is how Express identifies
 * error-handling middleware — all four parameters are required.
 */

'use strict';

/**
 * Express error-handling middleware for the BFF service.
 *
 * @param {Error}  err  - The error forwarded by a controller via next(err).
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next - Required by Express for error handlers.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // fetch() throws a TypeError when the TCP connection to the backend fails.
  // Report this as 502 Bad Gateway so the SPA can distinguish a BFF error
  // from a legitimate backend 4xx/5xx response.
  if (err instanceof TypeError) {
    return res.status(502).json({ error: 'Backend service is unreachable' });
  }

  // Fallback for unexpected errors not caused by fetch.
  res.status(500).json({ error: 'An unexpected error occurred' });
}

module.exports = { errorHandler };

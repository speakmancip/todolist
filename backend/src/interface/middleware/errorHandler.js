/**
 * @file errorHandler.js
 * @description Global Express error handler for the backend service.
 *
 * ARCHITECTURE — Interface Layer:
 * This is the single place in the application that translates domain and
 * application error codes into HTTP status codes and JSON response bodies.
 * Keeping this mapping in one file means the rest of the codebase throws
 * plain objects with a `code` property — nothing else needs to know about
 * HTTP status codes.
 *
 * Express error handlers must have exactly four parameters (err, req, res, next).
 * Express identifies a four-argument middleware as an error handler and only
 * calls it when next(error) is invoked upstream.
 *
 * ERROR CODE → HTTP STATUS MAP:
 *  VALIDATION_ERROR → 422 Unprocessable Entity  (domain invariant violated)
 *  UNAUTHORIZED     → 401 Unauthorized           (bad credentials / missing token)
 *  CONFLICT         → 409 Conflict               (duplicate resource)
 *  NOT_FOUND        → 404 Not Found              (resource does not exist)
 *  Everything else  → 500 Internal Server Error
 */

'use strict';

/** Maps internal error codes to HTTP status codes. */
const STATUS_MAP = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED:     401,
  CONFLICT:         409,
  NOT_FOUND:        404,
};

/**
 * Express error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 *
 * @param {object} err - The error object passed to next(err).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next - Required by Express signature; not called.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status  = STATUS_MAP[err.code] || 500;
  const message = err.message || 'An unexpected error occurred';

  // Log unexpected server errors to stdout so they surface in Cloud Logging.
  if (status === 500) {
    process.stdout.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level:     'error',
        message:   'Unhandled error',
        error:     message,
        stack:     err.stack || null,
      }) + '\n'
    );
  }

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };

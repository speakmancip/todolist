/**
 * @file authenticate.js
 * @description JWT authentication middleware.
 *
 * ARCHITECTURE — Interface Layer:
 * This middleware sits at the boundary between the HTTP world and the
 * application layer. It verifies the JWT in the Authorization header and
 * attaches the authenticated userId to the request object so that
 * downstream controllers and use cases can use it without re-reading the token.
 *
 * The BFF forwards the Authorization header verbatim from the SPA — this
 * middleware is the only place in the entire backend that reads or validates
 * JWT tokens. The BFF never holds JWT_SECRET.
 *
 * HEADER FORMAT:
 *   Authorization: Bearer <token>
 *
 * ON SUCCESS: req.userId is set and next() is called.
 * ON FAILURE: next() is called with an UNAUTHORIZED error object, which the
 *   global error handler maps to HTTP 401.
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * Express middleware that verifies the JWT in the Authorization header.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next({ code: 'UNAUTHORIZED', message: 'Authorization token is required' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the userId from the token payload so controllers don't need to decode it.
    req.userId = payload.userId;
    next();
  } catch (error) {
    // jwt.verify throws for expired, malformed, or invalid-signature tokens.
    next({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };

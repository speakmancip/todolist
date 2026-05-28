/**
 * @file httpClient.js
 * @description HTTP client for proxying requests to the backend service.
 *
 * ARCHITECTURE — BFF Infrastructure:
 * This module is the single point of contact between the BFF and the backend.
 * All outbound HTTP calls go through backendRequest(). This makes it trivial
 * to mock in integration tests — jest.mock('./httpClient') replaces every
 * call in every controller without touching the real network.
 *
 * Uses Node 22's built-in fetch API — no additional HTTP library is needed.
 *
 * SECURITY:
 * The Authorization header is forwarded verbatim from the SPA to the backend.
 * The BFF never inspects, decodes, or validates JWT tokens — that is the sole
 * responsibility of the backend's authenticate middleware.
 */

'use strict';

/**
 * Makes an HTTP request to the backend service and returns the parsed response.
 *
 * BACKEND_URL is read at call time (not module load time) so that integration
 * tests setting process.env.BACKEND_URL before calling this function always
 * pick up the correct value.
 *
 * @param {object} options
 * @param {string} options.method  - HTTP method (GET, POST, PUT, PATCH, DELETE).
 * @param {string} options.path    - Path relative to BACKEND_URL (e.g. '/auth/login').
 * @param {object} [options.headers={}] - Additional request headers to forward.
 * @param {object} [options.body]       - Request body — serialised to JSON if present.
 *
 * @returns {Promise<{ status: number, body: object|null }>}
 *   The HTTP status code and the parsed JSON body from the backend.
 *   body is null if the backend sends an empty response (e.g. 204 No Content).
 *
 * @throws {TypeError} If the backend is unreachable (network error / ECONNREFUSED).
 *   The BFF errorHandler maps this to HTTP 502.
 */
async function backendRequest({ method, path, headers = {}, body }) {
  const backendUrl = process.env.BACKEND_URL;
  const url        = `${backendUrl}${path}`;

  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Only attach a body for methods that carry a payload.
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response     = await fetch(url, fetchOptions);
  // Gracefully handle empty bodies (e.g. 204 No Content from delete endpoints).
  const responseBody = await response.json().catch(() => null);

  return { status: response.status, body: responseBody };
}

module.exports = { backendRequest };

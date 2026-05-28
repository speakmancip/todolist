/**
 * @file client.js
 * @description HTTP client for making requests to the BFF service.
 *
 * ARCHITECTURE — Frontend API Layer:
 * This is the only file in the frontend that knows the BFF's base URL.
 * All network calls from the SPA go through apiFetch() so that the
 * Authorization header injection, JSON serialisation, and error shape
 * normalisation are handled in one place.
 *
 * CONFIGURATION:
 * BFF_URL is read from process.env.VITE_BFF_URL, which is injected at
 * build time by Vite's `define` option (see vite.config.js). In Jest tests
 * the api modules are mocked entirely, so this module is never loaded and
 * the variable is irrelevant.
 *
 * ERROR SHAPE:
 * When the BFF returns a non-2xx status, apiFetch throws a plain object:
 *   { status: <number>, message: <string> }
 * Components catch this and display `err.message` directly in the UI.
 */

const BFF_URL = process.env.VITE_BFF_URL || 'http://localhost:3002';

/**
 * Makes an HTTP request to the BFF and returns the parsed JSON response.
 *
 * @param {string} path - Path relative to BFF_URL (e.g. '/auth/login').
 * @param {object} [options={}]
 * @param {string} [options.method='GET'] - HTTP method.
 * @param {object} [options.headers={}]   - Additional request headers (e.g. Authorization).
 * @param {object} [options.body]         - Request body — serialised to JSON automatically.
 *
 * @returns {Promise<object>} Parsed JSON body from the BFF.
 *
 * @throws {{ status: number, message: string }}
 *   When the BFF returns a non-2xx status. `message` is taken from the
 *   `error` field in the response body, falling back to a generic string.
 */
async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const fetchInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    fetchInit.body = JSON.stringify(body);
  }

  const response     = await fetch(`${BFF_URL}${path}`, fetchInit);
  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    // Throw a plain object so components can display err.message directly.
    // eslint-disable-next-line no-throw-literal
    throw { status: response.status, message: responseBody?.error || 'An unexpected error occurred' };
  }

  return responseBody;
}

export { apiFetch };

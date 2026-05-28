/**
 * @file server.js
 * @description HTTP server entry point for the BFF service.
 *
 * ARCHITECTURE — BFF Entry Point:
 * This is the only file in the BFF that calls app.listen(). Keeping the
 * server bootstrap separate from the app factory (app.js) allows test
 * suites to import the app without binding a real network port.
 *
 * 12-Factor III — Config:
 * dotenv is loaded here so environment variables from .env are available
 * before any module reads process.env. config.validate() then asserts that
 * all required variables are present, halting startup on misconfiguration.
 *
 * 12-Factor XI — Logs:
 * Startup is logged as a structured JSON line to stdout so it is visible
 * in any log aggregator without additional parsing.
 */

'use strict';

require('dotenv').config();

// Validate all required env vars before building the app.
// This throws immediately on startup if BACKEND_URL or CORS_ORIGIN are absent,
// surfacing misconfiguration before the first request is ever served.
const { validate, PORT } = require('./config');
validate();

const { createApp } = require('./app');

const app = createApp();

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level:     'info',
      service:   'todolist-bff',
      message:   `Server listening on port ${PORT}`,
    })
  );
});

/**
 * @file server.js
 * @description HTTP server entry point for the backend service.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * This is the only file in the backend that calls app.listen(). It is
 * intentionally thin — all application setup lives in app.js so that
 * test suites can import the app without starting a server.
 *
 * 12-Factor III — Config:
 * The PORT is read exclusively from the environment. It must never be
 * hard-coded here. Set it in your .env file (see .env.example).
 *
 * 12-Factor XI — Logs:
 * The startup message is emitted as a structured JSON line to stdout.
 * This makes it parseable by log aggregators (GCP Cloud Logging, etc.)
 * without any additional configuration.
 */

'use strict';

// Load environment variables from .env into process.env.
// This must be called before any other module reads process.env.
require('dotenv').config();

const { createApp } = require('./app');

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
  // Structured JSON log line — machine-parseable and human-readable.
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level:     'info',
      service:   'todolist-backend',
      message:   `Server listening on port ${PORT}`,
    })
  );
});

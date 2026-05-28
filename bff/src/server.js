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
 * PORT is read from the environment. Set it in your .env file.
 *
 * 12-Factor XI — Logs:
 * Startup is logged as a structured JSON line to stdout.
 */

'use strict';

require('dotenv').config();

const { createApp } = require('./app');

const PORT = process.env.PORT || 3002;
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

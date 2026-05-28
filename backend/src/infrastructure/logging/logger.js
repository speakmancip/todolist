/**
 * @file logger.js
 * @description Structured logger for the backend service.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * The logger sits in the infrastructure layer because it has two I/O
 * side effects: writing to stdout and writing to the database. The
 * application layer receives a logger object via dependency injection
 * and calls log() without knowing how the output is handled.
 *
 * 12-Factor XI — Logs:
 * Each log line is written to stdout as a single JSON object. This makes
 * logs machine-parseable by aggregators (GCP Cloud Logging, Datadog, etc.)
 * without any additional configuration. Stdout is the only correct output
 * stream for logs in a 12-factor application.
 *
 * DUAL OUTPUT:
 * In addition to stdout, each entry is persisted to the logs table so that
 * audit queries can be run against the database directly.
 */

'use strict';

const { createLogEntry } = require('../../domain/log/LogEntry');

/**
 * Creates a logger instance bound to a LogRepository.
 *
 * @param {object} logRepository - An object implementing LogRepository#save.
 * @returns {object} A logger with a single log() method.
 */
function createLogger(logRepository) {
  return {
    /**
     * Records an auditable event to stdout (JSON) and to the database.
     *
     * @param {object} params - The event details.
     * @param {string} [params.userId] - ID of the user who triggered the event.
     * @param {string} params.action - Short machine-readable event name, e.g. 'TODO_CREATED'.
     * @param {string} params.message - Human-readable description of the event.
     * @returns {Promise<void>}
     */
    async log({ userId, action, message }) {
      const entry = createLogEntry({ userId, action, message });

      // Write structured JSON to stdout — one line per event.
      // JSON.stringify produces a single line with no internal newlines.
      process.stdout.write(
        JSON.stringify({
          timestamp: entry.timestamp,
          level:     'info',
          userId:    entry.userId,
          action:    entry.action,
          message:   entry.message,
        }) + '\n'
      );

      // Persist to the database for audit queries.
      await logRepository.save(entry);
    },
  };
}

module.exports = { createLogger };

/**
 * @file LogEntry.js
 * @description LogEntry value object for the domain layer.
 *
 * ARCHITECTURE — Domain Layer:
 * A LogEntry is a value object (not an entity) — it has no unique identity
 * and is never mutated after creation. It records a single auditable event
 * in the system: who did what, and when.
 *
 * VALUE OBJECT vs ENTITY:
 * Entities (Todo, User) have a unique ID and a lifecycle. Value objects
 * describe a fact at a point in time. Two LogEntries with identical fields
 * are considered equal — there is no need to distinguish between them by ID.
 *
 * Logged across all three layers:
 *  - Backend: every use-case mutation logs an entry (create, delete, auth, etc.)
 *  - Stdout: logger.js writes each entry as a structured JSON line (12-Factor XI)
 *  - Database: entries are also persisted to the logs table for audit queries
 */

'use strict';

/**
 * Creates a new LogEntry value object.
 *
 * Stamps the current timestamp automatically if one is not provided,
 * so callers in the application layer never have to think about it.
 *
 * @param {object} params - The log event data.
 * @param {string} [params.timestamp] - ISO 8601 timestamp. Defaults to now.
 * @param {string|null} [params.userId] - ID of the user who triggered the event.
 *   May be null for system-level events (e.g. failed login with unknown email).
 * @param {string} params.action - Short machine-readable event name, e.g. 'TODO_CREATED'.
 * @param {string} params.message - Human-readable description of the event.
 *
 * @returns {Readonly<object>} A frozen LogEntry value object.
 */
function createLogEntry({ timestamp, userId, action, message }) {
  return Object.freeze({
    // Default to the current time if the caller does not provide a timestamp.
    timestamp: timestamp || new Date().toISOString(),
    userId:    userId || null,
    action,
    message,
  });
}

module.exports = { createLogEntry };

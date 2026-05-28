/**
 * @file LogRepository.js
 * @description Repository interface contract for the LogEntry value object.
 *
 * ARCHITECTURE — Domain Layer:
 * Defines the persistence interface for log entries. No executable code.
 *
 * The concrete implementation lives in:
 *  infrastructure/repositories/SqliteLogRepository.js
 */

'use strict';

/**
 * @interface LogRepository
 */

/**
 * Persists a LogEntry to the backing store.
 *
 * This is a write-only interface for this slice — log entries are never
 * queried back through the application layer (they can be read directly
 * from the database for audit purposes).
 *
 * @function
 * @name LogRepository#save
 * @param {Readonly<object>} logEntry - A frozen LogEntry created by createLogEntry().
 * @returns {Promise<void>}
 */

module.exports = {};

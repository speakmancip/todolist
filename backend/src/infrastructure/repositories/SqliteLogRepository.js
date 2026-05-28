/**
 * @file SqliteLogRepository.js
 * @description SQLite implementation of the LogRepository interface.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * Persists LogEntry value objects to the logs table. This is a write-only
 * repository for application use — log entries are never read back through
 * the application layer (they can be queried directly from the database
 * for audit or debugging purposes).
 */

'use strict';

/**
 * Creates a SqliteLogRepository bound to the provided database connection.
 *
 * @param {import('better-sqlite3').Database} db - The active SQLite connection.
 * @returns {object} An object implementing the LogRepository interface.
 */
function createSqliteLogRepository(db) {
  const insertStmt = db.prepare(`
    INSERT INTO logs (timestamp, user_id, action, message)
    VALUES (@timestamp, @userId, @action, @message)
  `);

  return {
    /**
     * Persists a LogEntry to the logs table.
     *
     * @param {Readonly<object>} logEntry - A frozen LogEntry from createLogEntry().
     * @returns {Promise<void>}
     */
    async save(logEntry) {
      insertStmt.run({
        timestamp: logEntry.timestamp,
        userId:    logEntry.userId,
        action:    logEntry.action,
        message:   logEntry.message,
      });
    },
  };
}

module.exports = { createSqliteLogRepository };

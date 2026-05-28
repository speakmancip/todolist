/**
 * @file migrations.js
 * @description Database schema migrations for the backend service.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * Applies the database schema at startup using CREATE TABLE IF NOT EXISTS,
 * making every statement idempotent — safe to run on a new or existing database.
 *
 * COLUMN NAMING:
 * SQLite columns use snake_case (user_id, is_completed). Repository
 * implementations map these to camelCase JS properties on every read.
 *
 * BOOLEAN STORAGE:
 * SQLite has no boolean type. is_completed is stored as INTEGER (0 or 1)
 * and cast to/from a JS boolean by the repository layer.
 */

'use strict';

/**
 * Applies all schema migrations to the provided database connection.
 * Called once during application startup before routes are registered.
 *
 * @param {import('better-sqlite3').Database} db - The SQLite database connection.
 * @returns {void}
 */
function runMigrations(db) {
  // users — stores registered accounts; email_address must be unique.
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id       TEXT PRIMARY KEY,
      email_address TEXT UNIQUE NOT NULL,
      password      TEXT NOT NULL,
      created_at    TEXT NOT NULL
    )
  `);

  // todos — each item belongs to one user via the user_id foreign key.
  // is_completed: 0 = false, 1 = true.
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT,
      due_date     TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL,
      user_id      TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  // logs — append-only audit table; user_id is nullable for pre-auth events.
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      user_id   TEXT,
      action    TEXT NOT NULL,
      message   TEXT NOT NULL
    )
  `);
}

module.exports = { runMigrations };

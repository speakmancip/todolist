/**
 * @file db.js
 * @description SQLite database connection singleton.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * Creates and caches the single better-sqlite3 connection used by the entire
 * backend process. All repository implementations receive this instance via
 * the app factory (app.js) — they never create their own connections.
 *
 * Node.js caches modules after the first require(), giving us a singleton
 * without extra state management.
 *
 * 12-Factor IV — Backing Services:
 * The database location is configured entirely via DB_PATH. Setting
 * DB_PATH=':memory:' in tests gives each suite a clean isolated database.
 */

'use strict';

const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || './data/todos.db';

/**
 * The single better-sqlite3 database connection for this process.
 *
 * @type {import('better-sqlite3').Database}
 */
const db = new Database(DB_PATH);

// WAL mode improves concurrent read performance.
db.pragma('journal_mode = WAL');

// SQLite does not enforce foreign keys by default — enable them explicitly.
db.pragma('foreign_keys = ON');

module.exports = db;

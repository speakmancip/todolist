/**
 * @file SqliteUserRepository.js
 * @description SQLite implementation of the UserRepository interface.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * Implements the contract defined in domain/user/UserRepository.js using
 * better-sqlite3. The application layer only ever calls the interface methods
 * (save, findByEmail, findById) — it has no knowledge of SQL or SQLite.
 *
 * SNAKE_CASE → camelCase MAPPING:
 * SQL columns use snake_case (email_address, user_id, created_at).
 * Every method that reads rows calls rowToUser() to convert them to the
 * camelCase shape that the rest of the application expects.
 */

'use strict';

/**
 * Maps a raw SQLite row object to a plain User entity object.
 * Called on every database read to ensure consistent property names.
 *
 * @param {object} row - The raw row returned by better-sqlite3.
 * @returns {Readonly<object>} A frozen User entity.
 */
function rowToUser(row) {
  return Object.freeze({
    userId:       row.user_id,
    emailAddress: row.email_address,
    password:     row.password,
    createdAt:    row.created_at,
  });
}

/**
 * Creates a SqliteUserRepository bound to the provided database connection.
 *
 * @param {import('better-sqlite3').Database} db - The active SQLite connection.
 * @returns {object} An object implementing the UserRepository interface.
 */
function createSqliteUserRepository(db) {
  // Prepare all statements once at construction time — better-sqlite3
  // recommends this pattern for performance and to catch SQL errors early.
  const insertStmt = db.prepare(`
    INSERT INTO users (user_id, email_address, password, created_at)
    VALUES (@userId, @emailAddress, @password, @createdAt)
  `);

  const findByEmailStmt = db.prepare(`
    SELECT * FROM users WHERE email_address = ?
  `);

  const findByIdStmt = db.prepare(`
    SELECT * FROM users WHERE user_id = ?
  `);

  return {
    /**
     * Persists a new User to the database.
     *
     * @param {Readonly<object>} user - A frozen User entity from createUser().
     * @returns {Promise<Readonly<object>>} The saved User.
     */
    async save(user) {
      insertStmt.run({
        userId:       user.userId,
        emailAddress: user.emailAddress,
        password:     user.password,
        createdAt:    user.createdAt,
      });
      return user;
    },

    /**
     * Finds a User by email address (case-insensitive via UNIQUE constraint).
     *
     * @param {string} emailAddress - The email to search for.
     * @returns {Promise<Readonly<object>|null>} The User, or null if not found.
     */
    async findByEmail(emailAddress) {
      const row = findByEmailStmt.get(emailAddress.toLowerCase());
      return row ? rowToUser(row) : null;
    },

    /**
     * Finds a User by their unique ID.
     *
     * @param {string} userId - The UUID to search for.
     * @returns {Promise<Readonly<object>|null>} The User, or null if not found.
     */
    async findById(userId) {
      const row = findByIdStmt.get(userId);
      return row ? rowToUser(row) : null;
    },
  };
}

module.exports = { createSqliteUserRepository };

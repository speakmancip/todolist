/**
 * @file SqliteTodoRepository.js
 * @description SQLite implementation of the TodoRepository interface.
 *
 * ARCHITECTURE — Infrastructure Layer:
 * Implements the contract defined in domain/todo/TodoRepository.js.
 * The application layer calls save() and findAllByUserId() — it never
 * writes SQL directly.
 *
 * BOOLEAN MAPPING:
 * is_completed is stored as INTEGER (0/1) in SQLite. rowToTodo() converts
 * it to a JS boolean on every read. Writes cast boolean to 0 or 1.
 *
 * ORDERING:
 * findAllByUserId returns todos newest-first (ORDER BY created_at DESC)
 * so the list view shows the most recently added item at the top.
 */

'use strict';

/**
 * Maps a raw SQLite row to a frozen Todo entity object.
 *
 * @param {object} row - Raw row from better-sqlite3.
 * @returns {Readonly<object>} A frozen Todo entity.
 */
function rowToTodo(row) {
  return Object.freeze({
    id:          row.id,
    title:       row.title,
    description: row.description || null,
    dueDate:     row.due_date || null,
    // SQLite stores booleans as 0/1 — convert back to JS boolean.
    isCompleted: row.is_completed === 1,
    createdAt:   row.created_at,
    userId:      row.user_id,
  });
}

/**
 * Creates a SqliteTodoRepository bound to the provided database connection.
 *
 * @param {import('better-sqlite3').Database} db - The active SQLite connection.
 * @returns {object} An object implementing the TodoRepository interface.
 */
function createSqliteTodoRepository(db) {
  const insertStmt = db.prepare(`
    INSERT INTO todos (id, title, description, due_date, is_completed, created_at, user_id)
    VALUES (@id, @title, @description, @dueDate, @isCompleted, @createdAt, @userId)
  `);

  const findAllByUserIdStmt = db.prepare(`
    SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC
  `);

  const findByIdStmt = db.prepare(`
    SELECT * FROM todos WHERE id = ?
  `);

  const updateStmt = db.prepare(`
    UPDATE todos
    SET title = @title, description = @description, due_date = @dueDate, is_completed = @isCompleted
    WHERE id = @id
  `);

  const deleteStmt = db.prepare(`
    DELETE FROM todos WHERE id = ?
  `);

  return {
    /**
     * Persists a new Todo to the database.
     *
     * @param {Readonly<object>} todo - A frozen Todo entity from createTodo().
     * @returns {Promise<Readonly<object>>} The saved Todo.
     */
    async save(todo) {
      insertStmt.run({
        id:          todo.id,
        title:       todo.title,
        description: todo.description,
        dueDate:     todo.dueDate,
        // Cast JS boolean to SQLite INTEGER (0 or 1).
        isCompleted: todo.isCompleted ? 1 : 0,
        createdAt:   todo.createdAt,
        userId:      todo.userId,
      });
      return todo;
    },

    /**
     * Retrieves all Todos for a given user, newest first.
     *
     * @param {string} userId - The authenticated user's ID.
     * @returns {Promise<Readonly<object>[]>} Array of frozen Todo entities.
     */
    async findAllByUserId(userId) {
      const rows = findAllByUserIdStmt.all(userId);
      return rows.map(rowToTodo);
    },

    /**
     * Retrieves a single Todo by its ID.
     *
     * @param {string} id - The UUID of the Todo.
     * @returns {Promise<Readonly<object>|null>} The Todo, or null if not found.
     */
    async findById(id) {
      const row = findByIdStmt.get(id);
      return row ? rowToTodo(row) : null;
    },

    /**
     * Updates an existing Todo's mutable fields.
     *
     * @param {Readonly<object>} todo - The updated Todo entity.
     * @returns {Promise<Readonly<object>>} The updated Todo.
     */
    async update(todo) {
      updateStmt.run({
        id:          todo.id,
        title:       todo.title,
        description: todo.description,
        dueDate:     todo.dueDate,
        isCompleted: todo.isCompleted ? 1 : 0,
      });
      return todo;
    },

    /**
     * Deletes a Todo by its ID.
     *
     * @param {string} id - The UUID of the Todo to delete.
     * @returns {Promise<void>}
     */
    async delete(id) {
      deleteStmt.run(id);
    },
  };
}

module.exports = { createSqliteTodoRepository };

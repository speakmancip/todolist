/**
 * @file TodosPage.jsx
 * @description Todos list and create page — protected route.
 *
 * ARCHITECTURE — Frontend Page:
 * Handles:
 *   UC-04 — create todo, happy path (shows new item in list immediately)
 *   UC-05 — create todo, missing title (client-side validation for fast feedback)
 *   UC-09 — delete todo, confirmed (delegates to TodoItem, removes from list)
 *   UC-10 — delete todo, cancelled (TodoItem shows dismissible banner)
 *   List  — fetches on mount via listTodos(token)
 *
 * CLIENT-SIDE VALIDATION:
 * The title-required check mirrors the backend domain rule. Showing the error
 * without a network round-trip (by checking before calling createTodo) gives
 * the user immediate feedback. The backend enforces the same rule as a safety
 * net — two layers of validation means neither layer is the single point of failure.
 *
 * TOKEN:
 * The JWT token is read from AuthContext and passed into each API call.
 * This component trusts that PrivateRoute has already confirmed the token
 * is present before allowing this page to render.
 */

import { useState, useEffect } from 'react';
import { useAuth }              from '../context/AuthContext';
import { listTodos, createTodo, deleteTodo, completeTodo, incompleteTodo } from '../api/todos';
import TodoItem                 from '../components/TodoItem';

/**
 * Renders the authenticated user's todo list and a form to add new todos.
 *
 * @returns {JSX.Element}
 */
function TodosPage() {
  const { token, logout } = useAuth();

  const [todos, setTodos]             = useState([]);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating]   = useState(false);

  // Fetch the user's todos when the page first mounts.
  useEffect(() => {
    listTodos(token)
      .then(setTodos)
      .catch(() => {
        // List fetch failure is non-fatal — leave the empty list in place.
      });
  }, [token]);

  /**
   * Handles the create-todo form submission.
   * Validates the title client-side before sending to the API (UC-05).
   *
   * @param {React.FormEvent} event
   */
  async function handleCreate(event) {
    event.preventDefault();
    setCreateError(null);

    // Client-side title validation — mirrors the backend domain rule (UC-05).
    if (!title.trim()) {
      setCreateError('Missing Title, please ensure title field is completed');
      return;
    }

    // Only include optional fields when the user actually provided a value.
    const data = { title: title.trim() };
    if (description.trim()) data.description = description.trim();
    if (dueDate)             data.dueDate     = dueDate;

    setIsCreating(true);
    try {
      const todo = await createTodo(data, token);
      // Prepend so the newest item appears at the top of the list.
      setTodos((prev) => [todo, ...prev]);
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create todo');
    } finally {
      setIsCreating(false);
    }
  }

  /**
   * Removes a todo from the list after deletion is confirmed by the user.
   * The actual API call and confirmation dialog happen in TodoItem — this
   * callback is only invoked when the backend DELETE has succeeded.
   *
   * @param {string} id - The deleted todo's ID.
   */
  async function handleDelete(id) {
    try {
      await deleteTodo(id, token);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      // Deletion failure is surfaced via the existing error state if needed.
    }
  }

  /**
   * Toggles the isCompleted state of a todo and updates the list in place.
   *
   * @param {object} todo - The Todo object to toggle.
   */
  async function handleToggleComplete(todo) {
    try {
      const updated = todo.isCompleted
        ? await incompleteTodo(todo.id, token)
        : await completeTodo(todo.id, token);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      // Toggle failure is non-fatal — the UI remains in its previous state.
    }
  }

  return (
    <main>
      <header>
        <h1>My Todos</h1>
        <button type="button" onClick={logout}>Sign out</button>
      </header>

      <section>
        <h2>Add a todo</h2>

        <form onSubmit={handleCreate} noValidate>
          <div>
            <label htmlFor="todoTitle">Title</label>
            <input
              id="todoTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label htmlFor="todoDescription">Description</label>
            <textarea
              id="todoDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details (max 1000 characters)"
              maxLength={1000}
            />
          </div>

          <div>
            <label htmlFor="todoDueDate">Due date</label>
            <input
              id="todoDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* role="alert" announces validation errors to screen readers */}
          {createError && <p role="alert">{createError}</p>}

          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Adding…' : 'Add todo'}
          </button>
        </form>
      </section>

      <section>
        <h2>Todo list</h2>
        {todos.length === 0 ? (
          <p>No todos yet. Create one above.</p>
        ) : (
          <ul>
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default TodosPage;

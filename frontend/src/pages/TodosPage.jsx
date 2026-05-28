/**
 * @file TodosPage.jsx
 * @description Todos list and create page — protected route.
 *
 * ARCHITECTURE — Frontend Page:
 * Handles:
 *   UC-04 — create todo, happy path (shows new item in list immediately)
 *   UC-05 — create todo, missing title (client-side validation for fast feedback)
 *   List todos — fetches on mount via listTodos(token)
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
import { listTodos, createTodo } from '../api/todos';

/**
 * Renders the authenticated user's todo list and a form to add new todos.
 *
 * @returns {JSX.Element}
 */
function TodosPage() {
  const { token, logout } = useAuth();

  const [todos, setTodos]           = useState([]);
  const [title, setTitle]           = useState('');
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating]   = useState(false);

  // Fetch the user's todos when the page first mounts.
  // Read operations are not logged per the backend's logging policy.
  useEffect(() => {
    listTodos(token)
      .then(setTodos)
      .catch(() => {
        // List fetch failure is non-fatal — leave the empty list in place.
        // A future iteration could display a dismissible error banner here.
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
    // Checking here avoids a network round-trip for the most common mistake.
    if (!title.trim()) {
      setCreateError('Missing Title, please ensure title field is completed');
      return;
    }

    setIsCreating(true);
    try {
      const todo = await createTodo({ title }, token);
      // Prepend so the newest item appears at the top of the list.
      setTodos((prev) => [todo, ...prev]);
      setTitle('');
    } catch (err) {
      // API errors (e.g. UC-08 description too long) are forwarded from the backend.
      setCreateError(err.message || 'Failed to create todo');
    } finally {
      setIsCreating(false);
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
              <li key={todo.id}>
                <span>{todo.title}</span>
                {todo.isCompleted && <span aria-label="completed"> (done)</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default TodosPage;

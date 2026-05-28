/**
 * @file TodoDetailPage.jsx
 * @description Todo detail, edit, and delete page — protected route.
 *
 * ARCHITECTURE — Frontend Page:
 * Handles:
 *   UC-06  View task — fetch and display full todo details on mount
 *   UC-07  Edit task — inline edit form, submit updates fields
 *   UC-08  Edit task, description too long — shows exact error message
 *   UC-09  Delete task, confirmed — calls API, navigates back to /todos
 *   UC-10  Delete task, cancelled — shows dismissible "Deletion cancelled" banner
 *
 * The page uses a single edit form that is always visible (no separate view/edit
 * mode toggle) so the user can update any field and save in one action.
 *
 * TOKEN:
 * Read from AuthContext. PrivateRoute guarantees the token is present.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import { getTodo, updateTodo, deleteTodo, completeTodo, incompleteTodo } from '../api/todos';

/**
 * Renders the detail, edit, and delete view for a single Todo.
 *
 * @returns {JSX.Element}
 */
function TodoDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { token }    = useAuth();

  const [todo, setTodo]               = useState(null);
  const [loadError, setLoadError]     = useState(null);

  // Controlled form fields — kept in sync with the current todo after fetch and save.
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]         = useState('');

  const [saveError, setSaveError]     = useState(null);
  const [isSaving, setIsSaving]       = useState(false);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [isToggling, setIsToggling]   = useState(false);

  // UC-10: shown when the user cancels the delete confirmation dialog.
  const [cancellationBannerVisible, setCancellationBannerVisible] = useState(false);

  // UC-06: fetch the todo on mount.
  useEffect(() => {
    getTodo(id, token)
      .then((fetched) => {
        setTodo(fetched);
        setTitle(fetched.title);
        setDescription(fetched.description || '');
        setDueDate(fetched.dueDate || '');
      })
      .catch(() => {
        setLoadError('Could not load this todo. It may have been deleted or you may not have permission to view it.');
      });
  }, [id, token]);

  /**
   * UC-07/UC-08: saves the edited fields to the backend.
   *
   * @param {React.FormEvent} event
   */
  async function handleSave(event) {
    event.preventDefault();
    setSaveError(null);

    setIsSaving(true);
    try {
      const updated = await updateTodo(id, { title, description, dueDate }, token);
      setTodo(updated);
      setTitle(updated.title);
      setDescription(updated.description || '');
      setDueDate(updated.dueDate || '');
    } catch (err) {
      // UC-08: backend returns the exact error message for description > 1000 chars.
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * UC-09/UC-10: handles delete button click with confirmation.
   * Uses window.confirm — returns true (confirmed) or false (cancelled).
   */
  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${todo.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      // UC-10: user cancelled — show a dismissible banner.
      setCancellationBannerVisible(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTodo(id, token);
      // UC-09: navigate back to the list after successful deletion.
      navigate('/todos');
    } catch (err) {
      setSaveError(err.message || 'Failed to delete todo');
      setIsDeleting(false);
    }
  }

  /**
   * Toggles the isCompleted state and updates local state to reflect the change.
   */
  async function handleToggleComplete() {
    setIsToggling(true);
    try {
      const updated = todo.isCompleted
        ? await incompleteTodo(id, token)
        : await completeTodo(id, token);
      setTodo(updated);
    } catch (err) {
      // Toggle failure is non-fatal — leave the todo in its current state.
    } finally {
      setIsToggling(false);
    }
  }

  // Early return states — rendered before the todo data is available.
  if (loadError) {
    return (
      <main>
        <nav><Link to="/todos">← Back to list</Link></nav>
        <p className="alert-error" role="alert">{loadError}</p>
      </main>
    );
  }

  if (!todo) {
    return (
      <main>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <nav>
        <Link to="/todos">← Back to list</Link>
      </nav>

      <div className="page-header">
        <h1>{todo.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            className={`status-badge ${todo.isCompleted ? 'status-badge--complete' : 'status-badge--incomplete'}`}
          >
            {todo.isCompleted ? 'Completed' : 'Incomplete'}
          </span>

          {/* Completion toggle */}
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleToggleComplete}
            disabled={isToggling}
            aria-label={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {todo.isCompleted ? 'Mark incomplete' : 'Mark complete'}
          </button>
        </div>
      </div>

      {/* UC-07 / UC-08: edit form — always visible, pre-filled with current values */}
      <section>
        <h2>Edit todo</h2>

        <form onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label htmlFor="detailTitle">Title</label>
            <input
              id="detailTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="detailDescription">Description</label>
            <textarea
              id="detailDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details (max 1000 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="detailDueDate">Due date</label>
            <input
              id="detailDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* role="alert" announces save errors (including UC-08) to screen readers */}
          {saveError && <p className="alert-error" role="alert">{saveError}</p>}

          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* UC-09 / UC-10: delete section */}
      <section className="danger-zone">
        <h2>Danger zone</h2>

        <button
          className="btn btn-danger"
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete this todo"
        >
          {isDeleting ? 'Deleting…' : 'Delete todo'}
        </button>

        {/* UC-10: dismissible cancellation banner */}
        {cancellationBannerVisible && (
          <p className="banner-info" role="status">
            Deletion cancelled
            <button
              className="btn btn-ghost"
              type="button"
              aria-label="Dismiss"
              onClick={() => setCancellationBannerVisible(false)}
            >
              ✕
            </button>
          </p>
        )}
      </section>
    </main>
  );
}

export default TodoDetailPage;

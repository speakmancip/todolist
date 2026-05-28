/**
 * @file TodoItem.jsx
 * @description Renders a single Todo list item with navigation, completion toggle, and delete.
 *
 * ARCHITECTURE — Frontend Component:
 * Presentational component used by TodosPage. Receives todo data and callbacks
 * as props — it owns no state other than the transient "deletion cancelled" banner.
 *
 * USE CASES COVERED:
 *   UC-06  Clicking the todo title navigates to the detail page.
 *   UC-09  Clicking Delete, then confirming, removes the todo from the list.
 *   UC-10  Clicking Delete, then cancelling, shows a dismissible "Deletion cancelled" banner.
 */

import { useState }  from 'react';
import { Link }      from 'react-router-dom';

/**
 * Renders one Todo item in the list.
 *
 * @param {object}   props
 * @param {object}   props.todo             - The Todo domain object.
 * @param {Function} props.onDelete         - Called with todo.id after confirmed deletion.
 * @param {Function} props.onToggleComplete - Called with the updated Todo after toggle.
 * @returns {JSX.Element}
 */
function TodoItem({ todo, onDelete, onToggleComplete }) {
  // Transient local state — only needed for the UC-10 cancellation banner.
  const [cancellationBannerVisible, setCancellationBannerVisible] = useState(false);

  /**
   * Handles the delete button click.
   * Uses window.confirm as a simple confirmation dialog (UC-09/UC-10).
   * A "Yes" dismisses the confirmation and triggers deletion.
   * A "No" shows a dismissible info banner: "Deletion cancelled" (UC-10).
   */
  function handleDeleteClick() {
    const confirmed = window.confirm(
      `Delete "${todo.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      // Delegate the actual API call and list update to the parent (TodosPage).
      onDelete(todo.id);
    } else {
      // UC-10: show a dismissible banner so the user knows the action was cancelled.
      setCancellationBannerVisible(true);
    }
  }

  return (
    <li>
      {/* UC-06: clicking the title navigates to the detail/edit page */}
      <Link to={`/todos/${todo.id}`}>{todo.title}</Link>

      {todo.isCompleted && <span aria-label="completed"> (done)</span>}

      {/* Completion toggle — calls the parent-provided handler */}
      <button
        type="button"
        aria-label={todo.isCompleted ? 'Mark incomplete' : 'Mark complete'}
        onClick={() => onToggleComplete(todo)}
      >
        {todo.isCompleted ? 'Undo' : 'Complete'}
      </button>

      {/* Delete with confirmation (UC-09/UC-10) */}
      <button
        type="button"
        aria-label={`Delete ${todo.title}`}
        onClick={handleDeleteClick}
      >
        Delete
      </button>

      {/* UC-10: dismissible cancellation banner shown after user cancels the dialog */}
      {cancellationBannerVisible && (
        <span role="status">
          Deletion cancelled{' '}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setCancellationBannerVisible(false)}
          >
            ✕
          </button>
        </span>
      )}
    </li>
  );
}

export default TodoItem;

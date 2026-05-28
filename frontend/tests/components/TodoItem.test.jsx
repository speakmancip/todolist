/**
 * @file TodoItem.test.jsx
 * @description Component tests for the TodoItem component.
 *
 * USE CASES COVERED:
 *   UC-06  Todo title renders as a link to /todos/:id
 *   UC-09  Delete confirmed — onDelete callback invoked
 *   UC-10  Delete cancelled — "Deletion cancelled" banner shown, onDelete not called
 *
 * TEST STRATEGY:
 * - window.confirm is mocked per test to simulate user confirmation choices.
 * - onDelete and onToggleComplete are jest.fn() spies so we can assert calls.
 * - Rendered in MemoryRouter since TodoItem uses <Link>.
 */

import { render, screen }   from '@testing-library/react';
import userEvent             from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter }      from 'react-router-dom';
import TodoItem              from '../../src/components/TodoItem';

const baseTodo = {
  id:          'todo-abc',
  title:       'Sample task',
  isCompleted: false,
  dueDate:     '2026-08-15',
};

/**
 * Renders TodoItem with sane defaults and returns the mocked callback spies.
 *
 * @param {object} [overrides] - Partial todo props.
 * @returns {{ onDelete: jest.Mock, onToggleComplete: jest.Mock }}
 */
function renderTodoItem(overrides = {}) {
  const onDelete          = jest.fn();
  const onToggleComplete  = jest.fn();
  const todo              = { ...baseTodo, ...overrides };

  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ul>
        <TodoItem
          todo={todo}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      </ul>
    </MemoryRouter>
  );

  return { onDelete, onToggleComplete };
}

describe('TodoItem', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // UC-06 — Navigation link and essential metadata
  // ---------------------------------------------------------------------------

  it('UC-06: renders the todo title as a link to /todos/:id', () => {
    renderTodoItem();

    const link = screen.getByRole('link', { name: 'Sample task' });
    expect(link).toHaveAttribute('href', '/todos/todo-abc');
  });

  it('shows the completion status', () => {
    renderTodoItem();
    expect(screen.getByLabelText('completion status')).toHaveTextContent('Incomplete');
  });

  it('shows "Completed" when isCompleted is true', () => {
    renderTodoItem({ isCompleted: true });
    expect(screen.getByLabelText('completion status')).toHaveTextContent('Completed');
  });

  it('shows the due date when one is provided', () => {
    renderTodoItem();
    expect(screen.getByLabelText('due date')).toHaveTextContent('Due: 2026-08-15');
  });

  it('omits the due date element when dueDate is null', () => {
    renderTodoItem({ dueDate: null });
    expect(screen.queryByLabelText('due date')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // UC-09 — Delete confirmed
  // ---------------------------------------------------------------------------

  it('UC-09: calls onDelete with the todo id when the user confirms deletion', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const { onDelete } = renderTodoItem();

    await userEvent.click(screen.getByRole('button', { name: /delete sample task/i }));

    expect(onDelete).toHaveBeenCalledWith('todo-abc');
  });

  it('UC-09: does not show the cancellation banner after confirmed deletion', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderTodoItem();

    await userEvent.click(screen.getByRole('button', { name: /delete sample task/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // UC-10 — Delete cancelled
  // ---------------------------------------------------------------------------

  it('UC-10: shows "Deletion cancelled" banner when the user cancels', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderTodoItem();

    await userEvent.click(screen.getByRole('button', { name: /delete sample task/i }));

    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Deletion cancelled');
  });

  it('UC-10: does not call onDelete when the user cancels', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    const { onDelete } = renderTodoItem();

    await userEvent.click(screen.getByRole('button', { name: /delete sample task/i }));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('UC-10: dismisses the banner when the dismiss button is clicked', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderTodoItem();

    await userEvent.click(screen.getByRole('button', { name: /delete sample task/i }));

    // Banner visible
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Dismiss it
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Completion toggle
  // ---------------------------------------------------------------------------

  it('calls onToggleComplete with the todo when the toggle button is clicked', async () => {
    const { onToggleComplete } = renderTodoItem();

    await userEvent.click(screen.getByRole('button', { name: /mark complete/i }));

    expect(onToggleComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'todo-abc' })
    );
  });
});

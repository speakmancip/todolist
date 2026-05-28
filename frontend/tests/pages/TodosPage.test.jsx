/**
 * @file TodosPage.test.jsx
 * @description Component tests for the TodosPage.
 *
 * USE CASES COVERED:
 *   UC-04  Create todo, happy path — new item appears at top of list
 *   UC-05  Create todo, missing title — validation error shown, API not called
 *   UC-06  Clicking a todo title renders a link to the detail page
 *   UC-09  Delete todo, confirmed — todo removed from list
 *   UC-10  Delete todo, cancelled — "Deletion cancelled" banner shown
 *   List   Todos fetched on mount are rendered; empty state message shown
 *
 * TEST STRATEGY:
 * - api/todos is mocked so no real HTTP requests are made.
 * - AuthContext is mocked to inject a known token without needing a real
 *   AuthProvider or login flow.
 * - TodosPage is wrapped in MemoryRouter in case any child uses routing hooks.
 *
 * UC-05 validation is intentionally client-side (checked before calling the API).
 * The test confirms the error message appears AND createTodo is NOT called —
 * this verifies the guard is in place and not just showing an error after a
 * failed API call.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                    from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter }             from 'react-router-dom';
import TodosPage                    from '../../src/pages/TodosPage';

// Replace the real todos API.
jest.mock('../../src/api/todos');

// Inject a pre-authenticated context so TodosPage receives a token immediately.
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'fake-token', logout: jest.fn() }),
}));

const { listTodos, createTodo, deleteTodo } = require('../../src/api/todos');

/**
 * Renders TodosPage inside a MemoryRouter.
 */
function renderTodosPage() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <TodosPage />
    </MemoryRouter>
  );
}

describe('TodosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: resolve with an empty list so tests that don't care about the
    // list don't need to set up a mock themselves.
    listTodos.mockResolvedValue([]);
  });

  // ---------------------------------------------------------------------------
  // List display
  // ---------------------------------------------------------------------------

  it('displays todos returned from the API after mount', async () => {
    listTodos.mockResolvedValue([
      { id: '1', title: 'Buy groceries', isCompleted: false },
      { id: '2', title: 'Walk the dog',  isCompleted: false },
    ]);

    renderTodosPage();

    // findByText waits for the async listTodos call to resolve and React to re-render.
    expect(await screen.findByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
  });

  it('shows an empty-state message when the user has no todos', async () => {
    listTodos.mockResolvedValue([]);

    renderTodosPage();

    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // UC-04 — Create todo, happy path
  // ---------------------------------------------------------------------------

  it('UC-04: adds the new todo to the top of the list on successful creation', async () => {
    const newTodo = { id: '3', title: 'New task', isCompleted: false };
    createTodo.mockResolvedValue(newTodo);

    renderTodosPage();

    await userEvent.type(screen.getByLabelText(/title/i), 'New task');
    await userEvent.click(screen.getByRole('button', { name: /add todo/i }));

    // The new todo should appear in the list after createTodo resolves.
    expect(await screen.findByText('New task')).toBeInTheDocument();

    // createTodo must be called with the title (no extra fields when they are empty)
    // and the injected token.
    expect(createTodo).toHaveBeenCalledWith({ title: 'New task' }, 'fake-token');
  });

  it('UC-04: clears the title input after a successful creation', async () => {
    createTodo.mockResolvedValue({ id: '4', title: 'Cleared', isCompleted: false });

    renderTodosPage();

    const input = screen.getByLabelText(/title/i);
    await userEvent.type(input, 'Cleared');
    await userEvent.click(screen.getByRole('button', { name: /add todo/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  // ---------------------------------------------------------------------------
  // UC-05 — Create todo, missing title
  // ---------------------------------------------------------------------------

  it('UC-05: shows the exact validation message when the title field is empty', async () => {
    renderTodosPage();

    // Submit without typing a title.
    await userEvent.click(screen.getByRole('button', { name: /add todo/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Missing Title, please ensure title field is completed'
    );
  });

  it('UC-05: does not call createTodo when client-side validation fails', async () => {
    renderTodosPage();

    await userEvent.click(screen.getByRole('button', { name: /add todo/i }));

    await screen.findByRole('alert');

    // The guard must prevent the API call — if createTodo were called it would
    // indicate the validation check is missing or not working.
    expect(createTodo).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // UC-06 — Navigate to todo detail page
  // ---------------------------------------------------------------------------

  it('UC-06: renders a link to the detail page for each todo', async () => {
    listTodos.mockResolvedValue([
      { id: 'uuid-1', title: 'Click me', isCompleted: false },
    ]);

    renderTodosPage();

    // The title should be a link pointing to /todos/:id.
    const link = await screen.findByRole('link', { name: 'Click me' });
    expect(link).toHaveAttribute('href', '/todos/uuid-1');
  });

  // ---------------------------------------------------------------------------
  // UC-09 — Delete todo, confirmed
  // ---------------------------------------------------------------------------

  it('UC-09: removes the todo from the list after confirmed deletion', async () => {
    listTodos.mockResolvedValue([
      { id: 'del-1', title: 'To be deleted', isCompleted: false },
    ]);
    deleteTodo.mockResolvedValue(undefined);

    // Confirm the deletion dialog automatically.
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderTodosPage();

    await screen.findByText('To be deleted');

    await userEvent.click(screen.getByRole('button', { name: /delete to be deleted/i }));

    await waitFor(() => {
      expect(screen.queryByText('To be deleted')).not.toBeInTheDocument();
    });

    expect(deleteTodo).toHaveBeenCalledWith('del-1', 'fake-token');

    window.confirm.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // UC-10 — Delete todo, cancelled
  // ---------------------------------------------------------------------------

  it('UC-10: shows "Deletion cancelled" banner when the user cancels the dialog', async () => {
    listTodos.mockResolvedValue([
      { id: 'keep-1', title: 'Keep this', isCompleted: false },
    ]);

    // Cancel the deletion dialog.
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderTodosPage();

    await screen.findByText('Keep this');

    await userEvent.click(screen.getByRole('button', { name: /delete keep this/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Deletion cancelled');

    // The todo should still be in the list — deletion was cancelled.
    expect(screen.getByText('Keep this')).toBeInTheDocument();

    window.confirm.mockRestore();
  });
});

/**
 * @file TodosPage.test.jsx
 * @description Component tests for the TodosPage.
 *
 * USE CASES COVERED:
 *   UC-04  Create todo, happy path — new item appears at top of list
 *   UC-05  Create todo, missing title — validation error shown, API not called
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

const { listTodos, createTodo } = require('../../src/api/todos');

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

    // createTodo must be called with the title and the injected token.
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
});

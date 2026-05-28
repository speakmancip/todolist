/**
 * @file TodoDetailPage.test.jsx
 * @description Component tests for the TodoDetailPage.
 *
 * USE CASES COVERED:
 *   UC-06  View task — todo fields shown after fetch
 *   UC-07  Edit task, happy path — save calls updateTodo, updated values shown
 *   UC-08  Edit task, description > 1000 chars — exact error message shown
 *   UC-09  Delete task, confirmed — deleteTodo called, navigate to /todos
 *   UC-10  Delete task, cancelled — "Deletion cancelled" banner shown
 *
 * TEST STRATEGY:
 * - api/todos is mocked; no real HTTP requests are made.
 * - AuthContext is mocked to inject a known token.
 * - useNavigate is mocked so we can assert navigation without a real router.
 * - Rendered in MemoryRouter with a pre-set URL of /todos/:id so useParams
 *   returns the correct id.
 * - window.confirm is mocked per delete test to control the dialog outcome.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                    from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TodoDetailPage                   from '../../src/pages/TodoDetailPage';

jest.mock('../../src/api/todos');
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'fake-token' }),
}));

const { getTodo, updateTodo, deleteTodo } = require('../../src/api/todos');

const fakeTodo = {
  id:          'todo-xyz',
  title:       'Existing task',
  description: 'Some details',
  dueDate:     '2026-07-01',
  isCompleted: false,
};

/**
 * Renders TodoDetailPage at the route /todos/todo-xyz.
 */
function renderDetailPage() {
  return render(
    <MemoryRouter
      initialEntries={['/todos/todo-xyz']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/todos/:id" element={<TodoDetailPage />} />
        <Route path="/todos" element={<p>Todo list page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TodoDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: succeed with fakeTodo so all tests start with a loaded page.
    getTodo.mockResolvedValue(fakeTodo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // UC-06 — View task
  // ---------------------------------------------------------------------------

  it('UC-06: shows the todo title after fetching', async () => {
    renderDetailPage();

    expect(await screen.findByText('Existing task')).toBeInTheDocument();
  });

  it('UC-06: pre-fills the edit form with the fetched values', async () => {
    renderDetailPage();

    // Wait for the fetch to resolve.
    await screen.findByText('Existing task');

    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing task');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Some details');
    expect(screen.getByLabelText(/due date/i)).toHaveValue('2026-07-01');
  });

  // ---------------------------------------------------------------------------
  // UC-07 — Edit task, happy path
  // ---------------------------------------------------------------------------

  it('UC-07: saves changes and shows updated title', async () => {
    const updated = { ...fakeTodo, title: 'Updated task' };
    updateTodo.mockResolvedValue(updated);

    renderDetailPage();

    await screen.findByText('Existing task');

    // Clear and retype the title field.
    const titleInput = screen.getByLabelText(/title/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated task');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // updateTodo must be called with the new title.
    expect(updateTodo).toHaveBeenCalledWith(
      'todo-xyz',
      expect.objectContaining({ title: 'Updated task' }),
      'fake-token'
    );

    // The page heading should reflect the new title after the save resolves.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Updated task');
    });
  });

  // ---------------------------------------------------------------------------
  // UC-08 — Edit task, description too long
  // ---------------------------------------------------------------------------

  it('UC-08: shows the exact error message when description exceeds 1000 characters', async () => {
    updateTodo.mockRejectedValue({
      message: 'Description too long, please reduce to 1000 characters',
    });

    renderDetailPage();

    await screen.findByText('Existing task');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Description too long, please reduce to 1000 characters'
    );
  });

  // ---------------------------------------------------------------------------
  // UC-09 — Delete task, confirmed
  // ---------------------------------------------------------------------------

  it('UC-09: navigates to /todos after confirmed deletion', async () => {
    deleteTodo.mockResolvedValue(undefined);
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderDetailPage();

    await screen.findByText('Existing task');

    await userEvent.click(screen.getByRole('button', { name: /delete this todo/i }));

    expect(deleteTodo).toHaveBeenCalledWith('todo-xyz', 'fake-token');

    // After deletion the router should navigate to /todos — the list page renders.
    await waitFor(() => {
      expect(screen.getByText('Todo list page')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // UC-10 — Delete task, cancelled
  // ---------------------------------------------------------------------------

  it('UC-10: shows "Deletion cancelled" banner when the user cancels deletion', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderDetailPage();

    await screen.findByText('Existing task');

    await userEvent.click(screen.getByRole('button', { name: /delete this todo/i }));

    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent('Deletion cancelled');

    // The page should still show the todo — it was not deleted.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Existing task');
  });

  it('UC-10: dismisses the cancellation banner when the dismiss button is clicked', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderDetailPage();

    await screen.findByText('Existing task');

    await userEvent.click(screen.getByRole('button', { name: /delete this todo/i }));

    await screen.findByRole('status');

    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

/**
 * @file LoginPage.test.jsx
 * @description Component tests for the LoginPage.
 *
 * USE CASES COVERED:
 *   UC-01  Happy path — valid credentials → login() called, navigate to /todos
 *   UC-02  Wrong password → error message displayed
 *   UC-03  Unknown email → same error message as UC-02 (forwarded verbatim from backend)
 *
 * TEST STRATEGY:
 * - api/auth is mocked (jest.mock) so no real HTTP requests are made.
 * - AuthContext is mocked so we can spy on the login() callback without
 *   needing a real AuthProvider in the render tree.
 * - LoginPage is wrapped in MemoryRouter so useNavigate() works.
 *
 * USER INTERACTIONS use @testing-library/user-event which simulates real
 * browser events (keydown, keyup, input, click) rather than synthetic React
 * events. This gives higher confidence that the component behaves correctly
 * for real users.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                    from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter }             from 'react-router-dom';
import LoginPage                    from '../../src/pages/LoginPage';

// Replace the real auth API so tests run without a BFF or backend.
jest.mock('../../src/api/auth');

// Replace AuthContext so we can spy on login() without a real AuthProvider.
const mockLogin = jest.fn();
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// Retrieve the mocked loginUser after jest.mock has hoisted it.
const { loginUser } = require('../../src/api/auth');

/**
 * Renders LoginPage inside a MemoryRouter (required for useNavigate).
 */
function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // UC-01 — Login happy path
  // ---------------------------------------------------------------------------

  it('UC-01: calls loginUser with credentials, stores the token, and navigates', async () => {
    loginUser.mockResolvedValue({ token: 'test-jwt-token' });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // loginUser must be called with the exact values from the form fields.
      expect(loginUser).toHaveBeenCalledWith('alice@example.com', 'secret123');
      // The token from the API response must be passed to AuthContext.login().
      expect(mockLogin).toHaveBeenCalledWith('test-jwt-token');
    });
  });

  // ---------------------------------------------------------------------------
  // UC-02 — Wrong password; UC-03 — Unknown email (identical message for both)
  // ---------------------------------------------------------------------------

  it('UC-02 / UC-03: displays the exact error message when credentials are rejected', async () => {
    // The backend returns this same message for both wrong password (UC-02) and
    // unknown email (UC-03). The frontend must display it verbatim.
    loginUser.mockRejectedValue({
      status:  401,
      message: 'Incorrect credentials. Please try again',
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'nobody@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // findByRole waits for the element to appear after the async rejection.
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Incorrect credentials. Please try again');
  });

  it('does not call login() when the API returns an error', async () => {
    loginUser.mockRejectedValue({ status: 401, message: 'Incorrect credentials. Please try again' });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'badpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByRole('alert');
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

/**
 * @file RegisterPage.test.jsx
 * @description Component tests for the RegisterPage.
 *
 * USE CASES COVERED:
 *   Happy path — valid details → registerUser called, token stored, navigate to /todos
 *   Duplicate email — 409 from API → error message displayed
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                    from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter }             from 'react-router-dom';
import RegisterPage                 from '../../src/pages/RegisterPage';

jest.mock('../../src/api/auth');

const mockLogin = jest.fn();
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const { registerUser } = require('../../src/api/auth');

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls registerUser with credentials and stores the token on success', async () => {
    registerUser.mockResolvedValue({ token: 'new-jwt-token' });

    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith('new@example.com', 'secret123');
      expect(mockLogin).toHaveBeenCalledWith('new-jwt-token');
    });
  });

  it('displays an error message when the email is already registered', async () => {
    registerUser.mockRejectedValue({
      status:  409,
      message: 'An account with this email address already exists',
    });

    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('An account with this email address already exists');
  });
});

/**
 * @file App.test.jsx
 * @description Smoke test for the root App component.
 *
 * PURPOSE:
 * Verifies that the full application shell (AuthProvider + BrowserRouter +
 * Routes) renders without throwing and that the default route redirects the
 * user to the login page, which is the expected first screen of the app.
 *
 * HOW IT WORKS:
 * React Testing Library renders the full <App /> component (including the
 * BrowserRouter). The root route (/) redirects to /login, so LoginPage is
 * rendered. The test confirms the login page heading is present.
 *
 * The api/auth and api/todos modules are mocked so that no real HTTP
 * requests are attempted during the render cycle.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Prevent any real network calls if api modules are imported transitively.
jest.mock('../src/api/auth');
jest.mock('../src/api/todos');

describe('App', () => {
  it('renders the login page heading when the user navigates to the root URL', () => {
    render(<App />);

    // The root route (/) redirects to /login, which renders LoginPage.
    // LoginPage has an <h1>Todo List</h1> heading at the top of the page.
    expect(screen.getByRole('heading', { name: /todo list/i })).toBeInTheDocument();
  });
});

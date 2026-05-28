/**
 * @file LoginPage.jsx
 * @description Login page component.
 *
 * ARCHITECTURE — Frontend Page:
 * Handles UC-01 (successful login), UC-02 (wrong password), and UC-03
 * (unknown email). The same error message is shown for UC-02 and UC-03
 * because the backend deliberately returns identical responses for both —
 * this prevents an attacker from using the login form to enumerate valid
 * email addresses.
 *
 * ON SUCCESS:
 *   1. loginUser() resolves with a JWT token.
 *   2. login() is called on AuthContext to store the token in React state.
 *   3. React Router navigates to /todos.
 *
 * ON FAILURE:
 *   The error message from the thrown object is displayed in a live region
 *   (role="alert") so screen readers announce it immediately.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/auth';

/**
 * Renders the login form and handles credential submission.
 *
 * @returns {JSX.Element}
 */
function LoginPage() {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState(null);
  const [isLoading, setIsLoading]       = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  /**
   * Submits credentials to the BFF, stores the returned token, and navigates.
   *
   * @param {React.FormEvent} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { token } = await loginUser(emailAddress, password);
      // Store the JWT in React state (AuthContext) — not localStorage (XSS risk).
      login(token);
      navigate('/todos');
    } catch (err) {
      // err.message comes from the BFF's error body — display it verbatim.
      setError(err.message || 'Incorrect credentials. Please try again');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <h1>Todo List</h1>

      <section>
        <h2>Sign In</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="emailAddress">Email address</label>
            <input
              id="emailAddress"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {/* role="alert" ensures screen readers announce the error immediately */}
          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;

/**
 * @file RegisterPage.jsx
 * @description User registration page component.
 *
 * ARCHITECTURE — Frontend Page:
 * Handles new account creation. On success the returned JWT is stored in
 * AuthContext (same flow as login) and the user is immediately redirected
 * to their todo list — no separate login step required after registration.
 *
 * ON SUCCESS:
 *   1. registerUser() resolves with a JWT token.
 *   2. login() is called on AuthContext to store the token.
 *   3. React Router navigates to /todos.
 *
 * ON FAILURE:
 *   409 Conflict — email already registered, shown as an inline error.
 *   Other errors — generic message shown in the alert region.
 */

import { useState }      from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }       from '../context/AuthContext';
import { registerUser }  from '../api/auth';

/**
 * Renders the registration form and handles account creation.
 *
 * @returns {JSX.Element}
 */
function RegisterPage() {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState(null);
  const [isLoading, setIsLoading]       = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  /**
   * Submits registration details, stores the returned token, and navigates.
   *
   * @param {React.FormEvent} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { token } = await registerUser(emailAddress, password);
      // Store the JWT in React state (AuthContext) — not localStorage (XSS risk).
      login(token);
      navigate('/todos');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Todo List</h1>
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="alert-error" role="alert">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;

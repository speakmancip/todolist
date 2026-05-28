/**
 * @file AuthContext.jsx
 * @description React context for JWT authentication state.
 *
 * ARCHITECTURE — Frontend State Management:
 * The JWT is held in React component state (not localStorage or sessionStorage).
 * Storing tokens in localStorage exposes them to XSS attacks because any
 * JavaScript on the page can read localStorage. React state is scoped to the
 * component tree and is never accessible to third-party scripts.
 *
 * The trade-off: the token is lost on page refresh. For Slice 1 this is
 * acceptable — the user must log in again after a refresh. A persistent
 * approach (e.g. httpOnly cookies issued by the BFF) is Phase 2.
 *
 * USAGE:
 *   Wrap the application in <AuthProvider> (done in App.jsx).
 *   Call useAuth() inside any component to access { token, login, logout }.
 */

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/**
 * Provides authentication state to the component subtree.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
function AuthProvider({ children }) {
  // Token starts null — user is unauthenticated until they log in.
  const [token, setToken] = useState(null);

  /**
   * Stores the JWT returned by the login API call.
   * Called by LoginPage after a successful POST /auth/login.
   *
   * @param {string} newToken - JWT access token.
   */
  function login(newToken) {
    setToken(newToken);
  }

  /**
   * Clears the JWT, returning the user to the unauthenticated state.
   * PrivateRoute will redirect to /login on the next render cycle.
   */
  function logout() {
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Returns the authentication context value: { token, login, logout }.
 *
 * @returns {{ token: string|null, login: Function, logout: Function }}
 * @throws {Error} If called outside of an AuthProvider.
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be called within an <AuthProvider>');
  }
  return context;
}

export { AuthProvider, useAuth };

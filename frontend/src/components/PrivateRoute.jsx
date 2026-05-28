/**
 * @file PrivateRoute.jsx
 * @description Route guard that redirects unauthenticated users to the login page.
 *
 * ARCHITECTURE — Frontend Component:
 * Wraps a protected page element in App.jsx's route tree. If the user has
 * no token in AuthContext (i.e. they are not logged in, or their token was
 * cleared by logout()), they are redirected to /login.
 *
 * USAGE (in App.jsx):
 *   <Route
 *     path="/todos"
 *     element={<PrivateRoute><TodosPage /></PrivateRoute>}
 *   />
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Renders children when authenticated; redirects to /login when not.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The protected page component.
 * @returns {JSX.Element} Either the children or a <Navigate> redirect.
 */
function PrivateRoute({ children }) {
  const { token } = useAuth();

  // Replace the current history entry so the back button does not return
  // the user to a protected route they cannot access.
  return token ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;

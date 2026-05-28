/**
 * @file App.jsx
 * @description Root React component — application shell and routing.
 *
 * ARCHITECTURE — Frontend Root:
 * App is the composition root of the React SPA. It wires together:
 *
 *   AuthProvider   — provides JWT state to the entire component tree
 *   BrowserRouter  — enables React Router v6 navigation
 *   Routes         — declarative route definitions
 *   PrivateRoute   — redirects unauthenticated users to /login
 *
 * ROUTE TABLE:
 *   /              → redirects to /login
 *   /login         → LoginPage (public)
 *   /register      → RegisterPage (public)
 *   /todos         → TodosPage (protected by PrivateRoute)
 *   /todos/:id     → TodoDetailPage (protected by PrivateRoute)
 *
 * app.js never calls app.listen() — that is the sole responsibility of
 * main.jsx. This is the frontend equivalent of the backend separation
 * between app.js and server.js.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import PrivateRoute      from './components/PrivateRoute';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import TodosPage         from './pages/TodosPage';
import TodoDetailPage    from './pages/TodoDetailPage';

/**
 * Root application component.
 *
 * @returns {JSX.Element} The fully wired application shell.
 */
function App() {
  return (
    <AuthProvider>
      {/* v7_relativeSplatPath opts in to the v7 splat resolution behaviour early */}
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — PrivateRoute redirects to /login if unauthenticated */}
          <Route path="/todos" element={<PrivateRoute><TodosPage /></PrivateRoute>} />
          <Route path="/todos/:id" element={<PrivateRoute><TodoDetailPage /></PrivateRoute>} />

          {/* Default: redirect root to the login page */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

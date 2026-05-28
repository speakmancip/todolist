/**
 * @file App.test.jsx
 * @description Phase 0 smoke test for the root React component.
 *
 * PURPOSE:
 * This test exists as the gate for Phase 0 of the build process. It must
 * pass before any feature code is written. It verifies two things:
 *  1. The App component renders without throwing.
 *  2. The expected placeholder heading is present in the DOM.
 *
 * HOW IT WORKS:
 * React Testing Library renders the component into a simulated browser DOM
 * (jsdom) and queries the result using accessible queries. No real browser,
 * BFF, or backend is involved.
 *
 * WHAT IT DOES NOT TEST:
 * - Routing (React Router is not yet wired up in the skeleton)
 * - Authentication (AuthContext is not yet present)
 * - API calls (no network requests are made)
 * These are covered by tests added in Phase 6.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

describe('App (skeleton smoke test)', () => {
  it('renders the application heading without crashing', () => {
    render(<App />);

    // The heading is the simplest observable output of the skeleton App.
    // In the full implementation this test will be replaced by page-level tests.
    expect(screen.getByRole('heading', { name: /todo list/i })).toBeInTheDocument();
  });
});

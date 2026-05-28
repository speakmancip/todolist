/**
 * @file vite.config.js
 * @description Vite build configuration for the React SPA.
 *
 * Vite is the development server and production bundler for the frontend.
 * It provides fast hot-module replacement (HMR) during development and
 * produces an optimised static bundle (in dist/) for production deployment.
 *
 * @vitejs/plugin-react enables:
 *  - JSX transformation without an explicit React import (automatic runtime)
 *  - Fast Refresh (HMR for React components during development)
 *
 * define:
 *  Vite replaces process.env.VITE_BFF_URL at bundle time so the string is
 *  inlined into the browser bundle. This allows api/client.js to use the
 *  same process.env pattern that Jest reads natively in Node.js — one
 *  variable, no import.meta.env, no separate test stub required.
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // loadEnv reads the .env file for the current mode (development/production).
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Inline the BFF URL into the bundle so the browser can resolve it.
      // Falls back to localhost for local development without a .env file.
      'process.env.VITE_BFF_URL': JSON.stringify(env.VITE_BFF_URL || 'http://localhost:3002'),
    },
  };
});

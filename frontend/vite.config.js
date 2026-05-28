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
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});

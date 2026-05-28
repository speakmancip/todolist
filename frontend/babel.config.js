/**
 * @file babel.config.js
 * @description Babel configuration for the frontend test suite.
 *
 * Vite handles transpilation during development and production builds using
 * its own pipeline (esbuild + @vitejs/plugin-react). However, Jest runs in
 * Node.js and does not use Vite — it needs Babel to understand JSX syntax
 * and modern JavaScript features.
 *
 * Presets used:
 *  - @babel/preset-env   — transpiles modern JS (ES modules, optional chaining,
 *                          etc.) to the CommonJS format Jest expects.
 *  - @babel/preset-react — transforms JSX into React.createElement calls.
 *                          { runtime: 'automatic' } means components do not
 *                          need to import React explicitly (React 17+ style).
 */

'use strict';

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};

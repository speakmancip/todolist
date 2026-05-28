/**
 * @file main.jsx
 * @description React application entry point.
 *
 * ARCHITECTURE — Frontend Entry Point:
 * This file is the first JavaScript module executed by Vite. It mounts the
 * root React component (<App />) into the #root div defined in index.html.
 *
 * React.StrictMode is enabled to surface potential problems during development:
 *  - Detects components with side effects in unexpected lifecycle phases
 *  - Warns about deprecated APIs
 * StrictMode has no effect in production builds.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

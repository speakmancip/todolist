/**
 * @file jest.config.js
 * @description Jest configuration for the React frontend.
 *
 * Key choices:
 *  - testEnvironment: 'jsdom'  — simulates a browser DOM so React components
 *    can render and fire events without a real browser.
 *  - transform: babel-jest     — transpiles JSX and modern JS syntax for Node.
 *  - setupFilesAfterFramework  — loads @testing-library/jest-dom matchers
 *    (e.g. toBeInTheDocument, toHaveTextContent) into every test file.
 *  - moduleNameMapper          — maps CSS/asset imports to stubs so component
 *    tests don't fail on non-JS imports.
 */

'use strict';

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.jsx', '**/tests/**/*.test.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    // Stub out CSS and static asset imports — they are irrelevant in unit tests.
    '\\.(css|svg|png|jpg|jpeg|gif)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
};

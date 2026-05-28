/**
 * @file fileMock.js
 * @description Jest module name mapper stub for static assets.
 *
 * When Jest encounters an import of a CSS file, image, or SVG it cannot
 * process the file as JavaScript. This stub returns an empty string so that
 * component tests do not fail on non-JS imports.
 *
 * Configured in jest.config.js under moduleNameMapper:
 *   '\\.(css|svg|png|jpg|jpeg|gif)$': '<rootDir>/tests/__mocks__/fileMock.js'
 */

module.exports = '';

/**
 * @file user.test.js
 * @description Unit tests for the User domain entity.
 *
 * Verifies the domain invariants enforced by the User factory:
 *  - emailAddress is required
 *  - emailAddress is normalised to lowercase
 *  - returned entity is frozen (immutable)
 *
 * No mocks, no I/O — pure JavaScript assertions.
 */

'use strict';

const { createUser } = require('../../../src/domain/user/User');

function validUserParams(overrides = {}) {
  return {
    userId:       'user-id-001',
    emailAddress: 'test@example.com',
    password:     'hashed-password-value',
    createdAt:    '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createUser — happy path
// ---------------------------------------------------------------------------
describe('createUser — happy path', () => {
  it('returns a frozen object with all provided fields', () => {
    const user = createUser(validUserParams());

    expect(user.userId).toBe('user-id-001');
    expect(user.emailAddress).toBe('test@example.com');
    expect(user.password).toBe('hashed-password-value');
    expect(Object.isFrozen(user)).toBe(true);
  });

  it('normalises emailAddress to lowercase', () => {
    const user = createUser(validUserParams({ emailAddress: 'User@Example.COM' }));
    expect(user.emailAddress).toBe('user@example.com');
  });

  it('trims whitespace from emailAddress', () => {
    const user = createUser(validUserParams({ emailAddress: '  user@example.com  ' }));
    expect(user.emailAddress).toBe('user@example.com');
  });
});

// ---------------------------------------------------------------------------
// createUser — emailAddress validation
// ---------------------------------------------------------------------------
describe('createUser — emailAddress validation', () => {
  it('throws VALIDATION_ERROR when emailAddress is missing', () => {
    expect(() => createUser(validUserParams({ emailAddress: undefined }))).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('throws VALIDATION_ERROR when emailAddress is an empty string', () => {
    expect(() => createUser(validUserParams({ emailAddress: '' }))).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('throws VALIDATION_ERROR when emailAddress is only whitespace', () => {
    expect(() => createUser(validUserParams({ emailAddress: '   ' }))).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });
});

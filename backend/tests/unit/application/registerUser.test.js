/**
 * @file registerUser.test.js
 * @description Unit tests for the registerUser application use case.
 *
 * Dependencies (userRepository, logRepository, logger) are replaced with
 * jest.fn() mocks so tests run without a database or JWT secret. The only
 * real code executing is the use case logic itself.
 *
 * Environment:
 * JWT_SECRET must be set before the module is loaded. We set it once here
 * in the describe block's beforeAll.
 */

'use strict';

const { registerUser } = require('../../../src/application/auth/registerUser');

// ---------------------------------------------------------------------------
// Mock factory — builds a fresh set of mocks for each test to prevent
// state leaking between tests.
// ---------------------------------------------------------------------------
function buildDeps(overrides = {}) {
  return {
    userRepository: {
      findByEmail: jest.fn().mockResolvedValue(null), // default: email not taken
      save:        jest.fn().mockResolvedValue(),
    },
    logRepository: {
      save: jest.fn().mockResolvedValue(),
    },
    logger: {
      log: jest.fn().mockResolvedValue(),
    },
    ...overrides,
  };
}

describe('registerUser', () => {
  beforeAll(() => {
    // JWT_SECRET is required by jsonwebtoken — set it before loading the module.
    process.env.JWT_SECRET = 'test-secret-for-unit-tests';
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  it('returns a token, userId, and emailAddress on success', async () => {
    const deps = buildDeps();
    const result = await registerUser(deps, {
      emailAddress: 'alice@example.com',
      password:     'securepassword',
    });

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('userId');
    expect(result.emailAddress).toBe('alice@example.com');
  });

  it('calls userRepository.save once with the new user', async () => {
    const deps = buildDeps();
    await registerUser(deps, { emailAddress: 'bob@example.com', password: 'pw' });

    expect(deps.userRepository.save).toHaveBeenCalledTimes(1);
    const savedUser = deps.userRepository.save.mock.calls[0][0];
    expect(savedUser.emailAddress).toBe('bob@example.com');
  });

  it('stores a hashed password, not the plain-text value', async () => {
    const deps = buildDeps();
    await registerUser(deps, { emailAddress: 'carol@example.com', password: 'mypassword' });

    const savedUser = deps.userRepository.save.mock.calls[0][0];
    // The saved password must not equal the plain-text value.
    expect(savedUser.password).not.toBe('mypassword');
    // It should start with a bcrypt hash prefix.
    expect(savedUser.password).toMatch(/^\$2[aby]\$/);
  });

  it('calls logger.log with USER_REGISTERED action', async () => {
    const deps = buildDeps();
    await registerUser(deps, { emailAddress: 'dave@example.com', password: 'pw' });

    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_REGISTERED' })
    );
  });

  // -------------------------------------------------------------------------
  // Duplicate email (CONFLICT)
  // -------------------------------------------------------------------------
  it('throws CONFLICT when the email address is already registered', async () => {
    const deps = buildDeps({
      userRepository: {
        findByEmail: jest.fn().mockResolvedValue({ userId: 'existing-id' }),
        save:        jest.fn(),
      },
    });

    await expect(
      registerUser(deps, { emailAddress: 'taken@example.com', password: 'pw' })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('does not call userRepository.save when email is already taken', async () => {
    const saveMock = jest.fn();
    const deps = buildDeps({
      userRepository: {
        findByEmail: jest.fn().mockResolvedValue({ userId: 'existing-id' }),
        save:        saveMock,
      },
    });

    await expect(
      registerUser(deps, { emailAddress: 'taken@example.com', password: 'pw' })
    ).rejects.toBeDefined();

    expect(saveMock).not.toHaveBeenCalled();
  });
});

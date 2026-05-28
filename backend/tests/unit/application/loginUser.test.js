/**
 * @file loginUser.test.js
 * @description Unit tests for the loginUser application use case.
 *
 * Key security requirement verified here: UC-02 and UC-03 must produce
 * identical UNAUTHORIZED errors — the response must not hint at whether
 * the email or password was wrong.
 */

'use strict';

const bcrypt = require('bcryptjs');
const { loginUser } = require('../../../src/application/auth/loginUser');

// Pre-hash a password once for all tests — bcrypt is slow by design.
let hashedPassword;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-for-unit-tests';
  hashedPassword = await bcrypt.hash('correctpassword', 10);
});

function buildDeps(userToReturn) {
  return {
    userRepository: {
      findByEmail: jest.fn().mockResolvedValue(userToReturn),
    },
    logger: {
      log: jest.fn().mockResolvedValue(),
    },
  };
}

function mockUser() {
  return {
    userId:       'user-id-001',
    emailAddress: 'alice@example.com',
    password:     hashedPassword,
  };
}

describe('loginUser', () => {
  // -------------------------------------------------------------------------
  // Happy path (UC-01)
  // -------------------------------------------------------------------------
  it('returns a token, userId, and emailAddress on success', async () => {
    const deps = buildDeps(mockUser());
    const result = await loginUser(deps, {
      emailAddress: 'alice@example.com',
      password:     'correctpassword',
    });

    expect(result).toHaveProperty('token');
    expect(result.userId).toBe('user-id-001');
    expect(result.emailAddress).toBe('alice@example.com');
  });

  it('calls logger.log with USER_LOGIN action on success', async () => {
    const deps = buildDeps(mockUser());
    await loginUser(deps, { emailAddress: 'alice@example.com', password: 'correctpassword' });

    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGIN' })
    );
  });

  // -------------------------------------------------------------------------
  // Wrong password (UC-02)
  // -------------------------------------------------------------------------
  it('throws UNAUTHORIZED when the password is incorrect', async () => {
    const deps = buildDeps(mockUser());

    await expect(
      loginUser(deps, { emailAddress: 'alice@example.com', password: 'wrongpassword' })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  // -------------------------------------------------------------------------
  // Unknown email (UC-03) — must produce the SAME error as UC-02
  // -------------------------------------------------------------------------
  it('throws UNAUTHORIZED when the email address is not found', async () => {
    const deps = buildDeps(null); // findByEmail returns null

    await expect(
      loginUser(deps, { emailAddress: 'unknown@example.com', password: 'anypassword' })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('returns the same error message for wrong password and unknown email', async () => {
    const wrongPasswordDeps = buildDeps(mockUser());
    const unknownEmailDeps  = buildDeps(null);

    let wrongPasswordError;
    let unknownEmailError;

    try {
      await loginUser(wrongPasswordDeps, { emailAddress: 'alice@example.com', password: 'bad' });
    } catch (error) {
      wrongPasswordError = error;
    }

    try {
      await loginUser(unknownEmailDeps, { emailAddress: 'noone@example.com', password: 'bad' });
    } catch (error) {
      unknownEmailError = error;
    }

    // The message must be identical — no field hint (UC-02 = UC-03).
    expect(wrongPasswordError.message).toBe(unknownEmailError.message);
  });
});

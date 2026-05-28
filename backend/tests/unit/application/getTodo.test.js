/**
 * @file getTodo.test.js
 * @description Unit tests for the getTodo use case.
 */

'use strict';

process.env.JWT_SECRET = 'test-secret';

const { getTodo } = require('../../../src/application/todo/getTodo');

const OWNER_ID = 'user-1';
const OTHER_ID = 'user-2';
const TODO_ID  = 'todo-1';

const baseTodo = {
  id:          TODO_ID,
  title:       'Test todo',
  description: null,
  dueDate:     null,
  isCompleted: false,
  createdAt:   '2026-01-01T00:00:00.000Z',
  userId:      OWNER_ID,
};

function makeDeps(overrides = {}) {
  return {
    todoRepository: {
      findById: jest.fn().mockResolvedValue(baseTodo),
      ...overrides,
    },
  };
}

describe('getTodo', () => {
  it('returns the todo when the requesting user is the owner', async () => {
    const result = await getTodo(makeDeps(), { id: TODO_ID, userId: OWNER_ID });
    expect(result).toEqual(baseTodo);
  });

  it('throws NOT_FOUND when no todo exists with the given ID', async () => {
    const deps = makeDeps({ findById: jest.fn().mockResolvedValue(null) });
    await expect(getTodo(deps, { id: TODO_ID, userId: OWNER_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN when the todo belongs to a different user', async () => {
    await expect(getTodo(makeDeps(), { id: TODO_ID, userId: OTHER_ID }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

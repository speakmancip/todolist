/**
 * @file deleteTodo.test.js
 * @description Unit tests for the deleteTodo use case.
 */

'use strict';

process.env.JWT_SECRET = 'test-secret';

const { deleteTodo } = require('../../../src/application/todo/deleteTodo');

const OWNER_ID = 'user-1';
const TODO_ID  = 'todo-1';

const baseTodo = {
  id:          TODO_ID,
  title:       'To be deleted',
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
      delete:   jest.fn().mockResolvedValue(undefined),
      ...overrides,
    },
    logger: { log: jest.fn() },
  };
}

describe('deleteTodo', () => {
  it('UC-09: deletes the todo and logs the action', async () => {
    const deps = makeDeps();
    await deleteTodo(deps, { id: TODO_ID, userId: OWNER_ID });
    expect(deps.todoRepository.delete).toHaveBeenCalledWith(TODO_ID);
    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TODO_DELETED' })
    );
  });

  it('returns void on success', async () => {
    const result = await deleteTodo(makeDeps(), { id: TODO_ID, userId: OWNER_ID });
    expect(result).toBeUndefined();
  });

  it('throws NOT_FOUND when the todo does not exist', async () => {
    const deps = makeDeps({ findById: jest.fn().mockResolvedValue(null) });
    await expect(deleteTodo(deps, { id: TODO_ID, userId: OWNER_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN when the todo belongs to another user', async () => {
    await expect(deleteTodo(makeDeps(), { id: TODO_ID, userId: 'other-user' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

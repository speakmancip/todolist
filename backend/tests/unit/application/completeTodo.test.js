/**
 * @file completeTodo.test.js
 * @description Unit tests for the completeTodo use case.
 */

'use strict';

process.env.JWT_SECRET = 'test-secret';

const { completeTodo }   = require('../../../src/application/todo/completeTodo');
const { incompleteTodo } = require('../../../src/application/todo/incompleteTodo');

const OWNER_ID = 'user-1';
const TODO_ID  = 'todo-1';

function makeTodo(isCompleted) {
  return {
    id:          TODO_ID,
    title:       'Test todo',
    description: null,
    dueDate:     null,
    isCompleted,
    createdAt:   '2026-01-01T00:00:00.000Z',
    userId:      OWNER_ID,
  };
}

function makeDeps(todo) {
  return {
    todoRepository: {
      findById: jest.fn().mockResolvedValue(todo),
      update:   jest.fn().mockImplementation((t) => Promise.resolve(t)),
    },
    logger: { log: jest.fn() },
  };
}

describe('completeTodo use case', () => {
  it('sets isCompleted to true and persists', async () => {
    const deps   = makeDeps(makeTodo(false));
    const result = await completeTodo(deps, { id: TODO_ID, userId: OWNER_ID });
    expect(result.isCompleted).toBe(true);
    expect(deps.todoRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: true })
    );
    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TODO_COMPLETED' })
    );
  });

  it('throws NOT_FOUND when todo does not exist', async () => {
    const deps = { todoRepository: { findById: jest.fn().mockResolvedValue(null) }, logger: { log: jest.fn() } };
    await expect(completeTodo(deps, { id: TODO_ID, userId: OWNER_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN for another user\'s todo', async () => {
    await expect(completeTodo(makeDeps(makeTodo(false)), { id: TODO_ID, userId: 'other' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('incompleteTodo use case', () => {
  it('sets isCompleted to false and persists', async () => {
    const deps   = makeDeps(makeTodo(true));
    const result = await incompleteTodo(deps, { id: TODO_ID, userId: OWNER_ID });
    expect(result.isCompleted).toBe(false);
    expect(deps.todoRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: false })
    );
    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TODO_INCOMPLETED' })
    );
  });

  it('throws NOT_FOUND when todo does not exist', async () => {
    const deps = { todoRepository: { findById: jest.fn().mockResolvedValue(null) }, logger: { log: jest.fn() } };
    await expect(incompleteTodo(deps, { id: TODO_ID, userId: OWNER_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN for another user\'s todo', async () => {
    await expect(incompleteTodo(makeDeps(makeTodo(true)), { id: TODO_ID, userId: 'other' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

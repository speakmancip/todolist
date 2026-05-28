/**
 * @file updateTodo.test.js
 * @description Unit tests for the updateTodo use case.
 */

'use strict';

process.env.JWT_SECRET = 'test-secret';

const { updateTodo } = require('../../../src/application/todo/updateTodo');

const OWNER_ID = 'user-1';
const TODO_ID  = 'todo-1';

const baseTodo = {
  id:          TODO_ID,
  title:       'Original title',
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
      update:   jest.fn().mockImplementation((t) => Promise.resolve(t)),
      ...overrides,
    },
    logger: { log: jest.fn() },
  };
}

describe('updateTodo', () => {
  it('UC-07: updates the title and returns the updated todo', async () => {
    const deps   = makeDeps();
    const result = await updateTodo(deps, { id: TODO_ID, userId: OWNER_ID, title: 'New title' });
    expect(result.title).toBe('New title');
    expect(deps.todoRepository.update).toHaveBeenCalledTimes(1);
    expect(deps.logger.log).toHaveBeenCalledTimes(1);
  });

  it('UC-08: throws VALIDATION_ERROR when description exceeds 1000 characters', async () => {
    await expect(
      updateTodo(makeDeps(), { id: TODO_ID, userId: OWNER_ID, description: 'x'.repeat(1001) })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('throws VALIDATION_ERROR when title is set to an empty string', async () => {
    await expect(
      updateTodo(makeDeps(), { id: TODO_ID, userId: OWNER_ID, title: '   ' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('throws NOT_FOUND when the todo does not exist', async () => {
    const deps = makeDeps({ findById: jest.fn().mockResolvedValue(null) });
    await expect(updateTodo(deps, { id: TODO_ID, userId: OWNER_ID, title: 'x' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN when the todo belongs to another user', async () => {
    await expect(
      updateTodo(makeDeps(), { id: TODO_ID, userId: 'other-user', title: 'x' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('preserves unchanged fields when only one field is provided', async () => {
    const deps   = makeDeps();
    const result = await updateTodo(deps, { id: TODO_ID, userId: OWNER_ID, dueDate: '2026-12-31' });
    expect(result.title).toBe('Original title');
    expect(result.dueDate).toBe('2026-12-31');
  });
});

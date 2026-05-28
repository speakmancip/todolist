/**
 * @file listTodos.test.js
 * @description Unit tests for the listTodos application use case.
 */

'use strict';

const { listTodos } = require('../../../src/application/todo/listTodos');

describe('listTodos', () => {
  it('returns the array provided by the repository', async () => {
    const fakeTodos = [
      { id: '1', title: 'First',  isCompleted: false, userId: 'user-id-001' },
      { id: '2', title: 'Second', isCompleted: true,  userId: 'user-id-001' },
    ];

    const deps = {
      todoRepository: {
        findAllByUserId: jest.fn().mockResolvedValue(fakeTodos),
      },
    };

    const result = await listTodos(deps, { userId: 'user-id-001' });

    expect(result).toEqual(fakeTodos);
    expect(result).toHaveLength(2);
  });

  it('calls findAllByUserId with the correct userId', async () => {
    const deps = {
      todoRepository: {
        findAllByUserId: jest.fn().mockResolvedValue([]),
      },
    };

    await listTodos(deps, { userId: 'user-id-abc' });

    expect(deps.todoRepository.findAllByUserId).toHaveBeenCalledWith('user-id-abc');
  });

  it('returns an empty array when the user has no todos', async () => {
    const deps = {
      todoRepository: {
        findAllByUserId: jest.fn().mockResolvedValue([]),
      },
    };

    const result = await listTodos(deps, { userId: 'user-id-001' });
    expect(result).toEqual([]);
  });
});

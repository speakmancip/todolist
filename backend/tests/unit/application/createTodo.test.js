/**
 * @file createTodo.test.js
 * @description Unit tests for the createTodo application use case.
 *
 * The domain factory (createTodoEntity) executes for real — this verifies
 * that the use case correctly delegates validation to the domain layer.
 * The repository and logger are mocked.
 */

'use strict';

const { createTodo } = require('../../../src/application/todo/createTodo');

function buildDeps(overrides = {}) {
  return {
    todoRepository: {
      save: jest.fn().mockResolvedValue(),
    },
    logger: {
      log: jest.fn().mockResolvedValue(),
    },
    ...overrides,
  };
}

describe('createTodo', () => {
  // -------------------------------------------------------------------------
  // Happy path (UC-04)
  // -------------------------------------------------------------------------
  it('returns a todo with the provided title and isCompleted: false', async () => {
    const deps = buildDeps();
    const todo = await createTodo(deps, {
      title:  'Buy milk',
      userId: 'user-id-001',
    });

    expect(todo.title).toBe('Buy milk');
    expect(todo.isCompleted).toBe(false);
    expect(todo.userId).toBe('user-id-001');
    expect(todo.id).toBeDefined();
  });

  it('calls todoRepository.save once with the new todo', async () => {
    const deps = buildDeps();
    await createTodo(deps, { title: 'Walk the dog', userId: 'user-id-001' });

    expect(deps.todoRepository.save).toHaveBeenCalledTimes(1);
  });

  it('calls logger.log with TODO_CREATED action', async () => {
    const deps = buildDeps();
    await createTodo(deps, { title: 'Read a book', userId: 'user-id-001' });

    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TODO_CREATED' })
    );
  });

  it('accepts an optional description and dueDate', async () => {
    const deps = buildDeps();
    const todo = await createTodo(deps, {
      title:       'Plan trip',
      description: 'Book flights and hotel',
      dueDate:     '2026-12-01',
      userId:      'user-id-001',
    });

    expect(todo.description).toBe('Book flights and hotel');
    expect(todo.dueDate).toBe('2026-12-01');
  });

  // -------------------------------------------------------------------------
  // Missing title (UC-05) — domain layer enforces this
  // -------------------------------------------------------------------------
  it('throws VALIDATION_ERROR when title is missing', async () => {
    const deps = buildDeps();

    await expect(
      createTodo(deps, { title: '', userId: 'user-id-001' })
    ).rejects.toMatchObject({
      code:    'VALIDATION_ERROR',
      message: 'Missing Title, please ensure title field is completed',
    });
  });

  it('does not call todoRepository.save when title is missing', async () => {
    const deps = buildDeps();

    await expect(
      createTodo(deps, { title: undefined, userId: 'user-id-001' })
    ).rejects.toBeDefined();

    expect(deps.todoRepository.save).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Description too long (UC-08) — domain layer enforces this
  // -------------------------------------------------------------------------
  it('throws VALIDATION_ERROR when description exceeds 1000 characters', async () => {
    const deps = buildDeps();

    await expect(
      createTodo(deps, { title: 'Valid title', description: 'x'.repeat(1001), userId: 'user-id-001' })
    ).rejects.toMatchObject({
      code:    'VALIDATION_ERROR',
      message: 'Description too long, please reduce to 1000 characters',
    });
  });
});

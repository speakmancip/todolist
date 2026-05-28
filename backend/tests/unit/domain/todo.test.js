/**
 * @file todo.test.js
 * @description Unit tests for the Todo domain entity.
 *
 * These tests verify every business rule enforced by the Todo domain layer:
 *  - title is required
 *  - description has a 1000-character limit
 *  - isCompleted defaults to false
 *  - completeTodo / incompleteTodo are pure (do not mutate the original)
 *
 * No mocks, no I/O, no framework — these run as plain JavaScript assertions.
 * If these tests break, a domain invariant has been violated somewhere.
 */

'use strict';

const { createTodo, completeTodo, incompleteTodo, VALIDATION_ERROR } = require('../../../src/domain/todo/Todo');

// ---------------------------------------------------------------------------
// Helper — builds a valid minimal Todo payload so tests only change the field
// they care about, keeping each test focused.
// ---------------------------------------------------------------------------
function validTodoParams(overrides = {}) {
  return {
    id:          'test-id-001',
    title:       'Buy groceries',
    description: null,
    dueDate:     null,
    isCompleted: false,
    createdAt:   '2026-01-01T10:00:00.000Z',
    userId:      'user-id-001',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createTodo — happy path
// ---------------------------------------------------------------------------
describe('createTodo — happy path', () => {
  it('returns a frozen object with all provided fields', () => {
    const todo = createTodo(validTodoParams());

    expect(todo.id).toBe('test-id-001');
    expect(todo.title).toBe('Buy groceries');
    expect(todo.userId).toBe('user-id-001');
    expect(Object.isFrozen(todo)).toBe(true);
  });

  it('trims whitespace from title', () => {
    const todo = createTodo(validTodoParams({ title: '  Buy milk  ' }));
    expect(todo.title).toBe('Buy milk');
  });

  it('defaults isCompleted to false when not provided', () => {
    const todo = createTodo(validTodoParams({ isCompleted: undefined }));
    expect(todo.isCompleted).toBe(false);
  });

  it('defaults isCompleted to false when explicitly passed false', () => {
    const todo = createTodo(validTodoParams({ isCompleted: false }));
    expect(todo.isCompleted).toBe(false);
  });

  it('accepts isCompleted: true when provided', () => {
    const todo = createTodo(validTodoParams({ isCompleted: true }));
    expect(todo.isCompleted).toBe(true);
  });

  it('accepts an optional description', () => {
    const todo = createTodo(validTodoParams({ description: 'Pick up milk and bread' }));
    expect(todo.description).toBe('Pick up milk and bread');
  });

  it('accepts an optional dueDate', () => {
    const todo = createTodo(validTodoParams({ dueDate: '2026-12-31' }));
    expect(todo.dueDate).toBe('2026-12-31');
  });

  it('sets description to null when not provided', () => {
    const todo = createTodo(validTodoParams({ description: undefined }));
    expect(todo.description).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createTodo — title validation (UC-05)
// ---------------------------------------------------------------------------
describe('createTodo — title validation', () => {
  it('throws VALIDATION_ERROR when title is missing', () => {
    expect(() => createTodo(validTodoParams({ title: undefined }))).toThrow(
      expect.objectContaining({ code: VALIDATION_ERROR })
    );
  });

  it('throws VALIDATION_ERROR when title is an empty string', () => {
    expect(() => createTodo(validTodoParams({ title: '' }))).toThrow(
      expect.objectContaining({ code: VALIDATION_ERROR })
    );
  });

  it('throws VALIDATION_ERROR when title is only whitespace', () => {
    expect(() => createTodo(validTodoParams({ title: '   ' }))).toThrow(
      expect.objectContaining({ code: VALIDATION_ERROR })
    );
  });

  it('includes the correct user-facing message in the error', () => {
    expect(() => createTodo(validTodoParams({ title: '' }))).toThrow(
      expect.objectContaining({
        message: 'Missing Title, please ensure title field is completed',
      })
    );
  });
});

// ---------------------------------------------------------------------------
// createTodo — description validation (UC-08)
// ---------------------------------------------------------------------------
describe('createTodo — description validation', () => {
  it('throws VALIDATION_ERROR when description exceeds 1000 characters', () => {
    const longDescription = 'a'.repeat(1001);
    expect(() => createTodo(validTodoParams({ description: longDescription }))).toThrow(
      expect.objectContaining({
        code:    VALIDATION_ERROR,
        message: 'Description too long, please reduce to 1000 characters',
      })
    );
  });

  it('accepts a description of exactly 1000 characters', () => {
    const maxDescription = 'a'.repeat(1000);
    const todo = createTodo(validTodoParams({ description: maxDescription }));
    expect(todo.description).toHaveLength(1000);
  });
});

// ---------------------------------------------------------------------------
// completeTodo — pure function, does not mutate original
// ---------------------------------------------------------------------------
describe('completeTodo', () => {
  it('returns a new Todo with isCompleted set to true', () => {
    const original = createTodo(validTodoParams({ isCompleted: false }));
    const completed = completeTodo(original);

    expect(completed.isCompleted).toBe(true);
  });

  it('does not mutate the original Todo', () => {
    const original = createTodo(validTodoParams({ isCompleted: false }));
    completeTodo(original);

    expect(original.isCompleted).toBe(false);
  });

  it('preserves all other fields on the returned Todo', () => {
    const original = createTodo(validTodoParams({ title: 'Walk the dog' }));
    const completed = completeTodo(original);

    expect(completed.title).toBe('Walk the dog');
    expect(completed.userId).toBe(original.userId);
  });

  it('returns a frozen object', () => {
    const original = createTodo(validTodoParams());
    const completed = completeTodo(original);
    expect(Object.isFrozen(completed)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// incompleteTodo — pure function, does not mutate original
// ---------------------------------------------------------------------------
describe('incompleteTodo', () => {
  it('returns a new Todo with isCompleted set to false', () => {
    const original = createTodo(validTodoParams({ isCompleted: true }));
    const incompleted = incompleteTodo(original);

    expect(incompleted.isCompleted).toBe(false);
  });

  it('does not mutate the original Todo', () => {
    const original = createTodo(validTodoParams({ isCompleted: true }));
    incompleteTodo(original);

    expect(original.isCompleted).toBe(true);
  });

  it('returns a frozen object', () => {
    const original = createTodo(validTodoParams({ isCompleted: true }));
    const incompleted = incompleteTodo(original);
    expect(Object.isFrozen(incompleted)).toBe(true);
  });
});

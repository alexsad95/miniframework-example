import { describe, expect, it } from 'bun:test';
import { writable } from '../src/utils/reactivity';

describe('Reactivity system', () => {
  describe('writable function', () => {
    it('should create a writable with initial value', () => {
      const store = writable(42);
      expect(store.get()).toBe(42);
    });

    it('should create a writable with string initial value', () => {
      const store = writable('hello');
      expect(store.get()).toBe('hello');
    });

    it('should create a writable with object initial value', () => {
      const initialValue = { name: 'test', count: 0 };
      const store = writable(initialValue);
      expect(store.get()).toEqual(initialValue);
    });

    it('should create a writable with array initial value', () => {
      const initialValue = [1, 2, 3];
      const store = writable(initialValue);
      expect(store.get()).toEqual(initialValue);
    });
  });

  describe('set method', () => {
    it('should update the value', () => {
      const store = writable(0);
      store.set(42);
      expect(store.get()).toBe(42);
    });

    it('should update with different types', () => {
      const store = writable(0);
      store.set('string');
      expect(store.get()).toBe('string');

      store.set({ obj: true });
      expect(store.get()).toEqual({ obj: true });

      store.set([1, 2, 3]);
      expect(store.get()).toEqual([1, 2, 3]);
    });

    it('should update with same value', () => {
      const store = writable(42);
      store.set(42);
      expect(store.get()).toBe(42);
    });
  });

  describe('update method', () => {
    it('should update value using function', () => {
      const store = writable(0);
      store.update((value) => value + 1);
      expect(store.get()).toBe(1);
    });

    it('should update with complex transformation', () => {
      const store = writable([1, 2, 3]);
      store.update((arr) => [...arr, 4]);
      expect(store.get()).toEqual([1, 2, 3, 4]);
    });

    it('should update object properties', () => {
      const store = writable({ count: 0, name: 'test' });
      store.update((obj) => ({ ...obj, count: obj.count + 1 }));
      expect(store.get()).toEqual({ count: 1, name: 'test' });
    });

    it('should handle multiple updates', () => {
      const store = writable(0);
      store.update((x) => x + 1);
      store.update((x) => x * 2);
      store.update((x) => x - 1);
      expect(store.get()).toBe(1);
    });
  });

  describe('subscribe method', () => {
    it('should call subscriber with current value immediately', () => {
      const store = writable(42);
      let receivedValue: number | undefined;

      store.subscribe((value) => {
        receivedValue = value;
      });

      expect(receivedValue).toBe(42);
    });

    it('should call subscriber when value changes', () => {
      const store = writable(0);
      const values: number[] = [];

      store.subscribe((value) => {
        values.push(value);
      });

      store.set(1);
      store.set(2);
      store.set(3);

      expect(values).toEqual([0, 1, 2, 3]);
    });

    it('should support multiple subscribers', () => {
      const store = writable(0);
      const values1: number[] = [];
      const values2: number[] = [];

      store.subscribe((value) => values1.push(value));
      store.subscribe((value) => values2.push(value));

      store.set(1);
      store.set(2);

      expect(values1).toEqual([0, 1, 2]);
      expect(values2).toEqual([0, 1, 2]);
    });

    it('should return unsubscribe function', () => {
      const store = writable(0);
      const values: number[] = [];

      const unsubscribe = store.subscribe((value) => {
        values.push(value);
      });

      store.set(1);
      unsubscribe();
      store.set(2);

      expect(values).toEqual([0, 1]);
    });

    it('should not call unsubscribed listeners', () => {
      const store = writable(0);
      let callCount = 0;

      const unsubscribe = store.subscribe(() => {
        callCount++;
      });

      store.set(1);
      expect(callCount).toBe(2); // Initial + first update

      unsubscribe();
      store.set(2);
      expect(callCount).toBe(2); // Should not increase
    });

    it('should handle multiple unsubscribes', () => {
      const store = writable(0);
      let callCount = 0;

      const unsubscribe = store.subscribe(() => {
        callCount++;
      });

      unsubscribe();
      unsubscribe(); // Should not throw

      store.set(1);
      expect(callCount).toBe(1); // Only initial call
    });
  });

  describe('integration tests', () => {
    it('should work with complex state management', () => {
      interface Todo {
        id: number;
        text: string;
        done: boolean;
      }

      const todos = writable<Todo[]>([]);
      const filter = writable<'all' | 'active' | 'completed'>('all');

      let todosCallCount = 0;
      let filterCallCount = 0;

      todos.subscribe(() => todosCallCount++);
      filter.subscribe(() => filterCallCount++);

      // Add todos
      todos.update((todos) => [
        ...todos,
        { id: 1, text: 'Learn reactivity', done: false },
        { id: 2, text: 'Build app', done: false },
      ]);

      // Mark one as done
      todos.update((todos) => todos.map((todo) => (todo.id === 1 ? { ...todo, done: true } : todo)));

      // Change filter
      filter.set('active');

      expect(todosCallCount).toBe(3); // Initial + 2 updates
      expect(filterCallCount).toBe(2); // Initial + 1 update
      expect(todos.get()).toHaveLength(2);
      expect(todos.get()[0].done).toBe(true);
      expect(filter.get()).toBe('active');
    });

    it('should handle rapid updates', () => {
      const store = writable(0);
      const values: number[] = [];

      store.subscribe((value) => values.push(value));

      // Rapid updates
      for (let i = 1; i <= 100; i++) {
        store.set(i);
      }

      expect(values).toHaveLength(101); // 0 + 100 updates
      expect(values[0]).toBe(0);
      expect(values[100]).toBe(100);
    });

    it('should maintain referential equality for same values', () => {
      const store = writable({ count: 0 });
      const values: any[] = [];

      store.subscribe((value) => values.push(value));

      const obj1 = { count: 1 };
      const obj2 = { count: 1 };

      store.set(obj1);
      store.set(obj2);
      store.set(obj1); // Same reference

      expect(values).toHaveLength(4); // Initial + 3 updates
      expect(values[1]).toBe(obj1);
      expect(values[2]).toBe(obj2);
      expect(values[3]).toBe(obj1);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values', () => {
      const store = writable<number | undefined>(undefined);
      expect(store.get()).toBe(undefined);

      store.set(42);
      expect(store.get()).toBe(42);

      store.set(undefined);
      expect(store.get()).toBe(undefined);
    });

    it('should handle null values', () => {
      const store = writable<number | null>(null);
      expect(store.get()).toBe(null);

      store.set(42);
      expect(store.get()).toBe(42);

      store.set(null);
      expect(store.get()).toBe(null);
    });

    it('should handle empty arrays and objects', () => {
      const arrayStore = writable<number[]>([]);
      const objectStore = writable<Record<string, any>>({});

      expect(arrayStore.get()).toEqual([]);
      expect(objectStore.get()).toEqual({});

      arrayStore.set([1, 2, 3]);
      objectStore.set({ key: 'value' });

      expect(arrayStore.get()).toEqual([1, 2, 3]);
      expect(objectStore.get()).toEqual({ key: 'value' });
    });

    it('should handle function values', () => {
      const store = writable<Function>(() => {});
      const fn = () => 'test';

      store.set(fn);
      expect(store.get()).toBe(fn);
    });
  });
});

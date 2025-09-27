export type Subscriber<T> = (value: T) => void;

export interface Writable<T> {
  subscribe: (fn: Subscriber<T>) => () => void;
  set: (value: T) => void;
  update: (fn: (value: T) => T) => void;
  get: () => T;
}

/*
 * Creating a reactive variable with the ability to subscribe to changes
 */
export function writable<T>(initial: T): Writable<T> {
  let value = initial;
  let subscribers: Subscriber<T>[] = [];

  const subscribe = (fn: Subscriber<T>) => {
    subscribers.push(fn);
    fn(value);
    return () => {
      subscribers = subscribers.filter((s) => s !== fn);
    };
  };

  const set = (newValue: T) => {
    value = newValue;
    subscribers.forEach((fn) => fn(value));
  };

  const update = (fn: (value: T) => T) => {
    set(fn(value));
  };

  const get = () => value;

  return {
    subscribe,
    set,
    update,
    get,
  };
}

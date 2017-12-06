export function noop() { }

export function wrapInPromise(value) {
  if (value && typeof value.then === 'function') {
    return value;
  }

  return Promise.resolve(value);
}

export function ensureArray(obj) {
  return Array.isArray(obj) ? obj : [obj];
}

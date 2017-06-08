import uid from 'uid-safe';

/**
 * @private
 */
export function randomString(size = 18, prefix = '') {
  return `${prefix}${uid.sync(size)}`;
}

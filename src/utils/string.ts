import uid = require('uid');

export function randomString(size?: string, prefix = '') {
  return `${prefix}${uid(size)}`;
}

import uid from 'uid';

export function randomString(size?: number, prefix = '') {
  return `${prefix}${uid(size)}`;
}

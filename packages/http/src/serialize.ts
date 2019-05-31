import isString from 'lodash/isString';

export function serialize(contentType: string, body?: any): string | any {
  if (body && !isString(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str = Object
        .keys(body)
        .reduce((parts: string[], key): string[] => {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`);
          return parts;
        }, []);
      return str.join('&');
    }

    if (contentType.indexOf('application/json') === 0) {
      return JSON.stringify(body);
    }
  }

  return body;
}

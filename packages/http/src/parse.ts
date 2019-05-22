import isString from 'lodash/isString';

function parseJSON(data?: any): any {
  if (isString(data)) {
    try {
      return JSON.parse(data);
    } catch (error) {
      // TODO: log error
    }
  }
  return data;
}

export function parse(contentType: string, data?: any): any {
  if (contentType.indexOf('application/json') !== -1) {
    return parseJSON(data);
  }
  return data;
}

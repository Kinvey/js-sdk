import { HttpHeaders } from '../headers';

describe('HttpHeaders', () => {
  describe('constructor', () => {
    it('should accept another HttpHeaders instance', () => {
      const headers1 = new HttpHeaders({ foo: 'bar' });
      const headers2 = new HttpHeaders(headers1);
      expect(headers2.get('foo')).toEqual(headers1.get('foo'));
    });
  });

  describe('contentType()', () => {
    it('should return the content-type', () => {
      const contentType = 'application/json';
      const headers = new HttpHeaders({ 'content-type': contentType });
      expect(headers.contentType).toEqual(contentType);
    });

    it('should set the content-type', () => {
      const contentType = 'application/xml';
      const headers = new HttpHeaders();
      expect(headers.contentType).toBe(undefined);
      headers.contentType = contentType;
      expect(headers.contentType).toEqual(contentType);
    });
  });
});

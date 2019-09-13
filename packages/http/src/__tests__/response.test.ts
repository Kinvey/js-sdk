import { HttpResponse } from '../response';

it('should throw a SyntaxError for incorrect formatted data', () => {
  expect(() => {
    return new HttpResponse({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      data: 'foobar',
    });
  }).toThrow(new SyntaxError('Unexpected token o in JSON at position 1'));
});

it('should parse the data', () => {
  const data = { foo: 'bar' };
  const response = new HttpResponse({
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify(data),
  });
  expect(response.data).toEqual(data);
});

it('should accept data as an object', () => {
  const data = { foo: 'bar' };
  const response = new HttpResponse({
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    data,
  });
  expect(response.data).toEqual(data);
});

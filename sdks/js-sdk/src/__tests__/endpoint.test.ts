import { endpoint } from '../endpoint';
import { init } from '../init';

beforeAll(() => {
  init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET,
  });
});

// @ts-ignore
it.nock('should call the endpoint and return the response', async () => {
  const response = await endpoint('test');
  expect(response).toEqual({ hello: 'world' });
});

// @ts-ignore
it.nock('should call the endpoint and return the response with args', async () => {
  const args = { hello: 'test' };
  const response = await endpoint('test', args);
  expect(response).toEqual(args);
});

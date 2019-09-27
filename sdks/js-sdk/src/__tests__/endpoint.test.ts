import nock from 'nock';
import { endpoint } from '../endpoint';
import { init } from '../init';

describe('Endpoint', () => {
  beforeAll(() => {
    init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET,
    });
  });

  it('should call the endpoint and return the response', async () => {
    nock('https://baas.kinvey.com')
      .post(`/rpc/${process.env.APP_KEY}/custom/test`)
      .reply(200, { hello: 'world' });
    const response = await endpoint('test');
    expect(response).toEqual({ hello: 'world' });
  });

  it('should call the endpoint and return the response with args', async () => {
    const args = { hello: 'test' };
    nock('https://baas.kinvey.com')
      .post(`/rpc/${process.env.APP_KEY}/custom/test`, args)
      .reply(200, { hello: 'test' });
    const response = await endpoint('test', args);
    expect(response).toEqual(args);
  });
});

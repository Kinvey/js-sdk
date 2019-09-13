import { send, setHttpAdapter, HttpRequestObject } from '../request';

describe('send()', () => {
  const request: HttpRequestObject = { headers: {}, method: 'GET', url: '', body: '', timeout: 1 };

  describe('without an adapter', () => {
    it('should throw an error by default', async () => {
      await expect(send(request)).rejects.toEqual(new Error('Please override the default http adapter.'));
    });
  });

  describe('with an adapter', () => {
    const httpAdapter = {
      send: jest.fn(() => {
        return Promise.resolve({
          statusCode: 200,
          headers: {},
        });
      }),
    };

    beforeEach(() => {
      setHttpAdapter(httpAdapter);
    });

    afterEach(() => {
      setHttpAdapter({
        async send() {
          throw new Error('Please override the default http adapter.');
        },
      });
    });

    it('should call adapter send()', async () => {
      await send(request);
      expect(httpAdapter.send).toHaveBeenCalledTimes(1);
      expect(httpAdapter.send).toHaveBeenLastCalledWith(request);
    });
  });
});

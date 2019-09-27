import times from 'lodash/times';
import nock from 'nock';
import { getApiVersion, setApiVersion } from '@progresskinvey/js-sdk-init';
import { collection, DataStoreType, Entity } from '../../../datastore';
import { init } from '../../../init';
import { login } from '../../../user';
import { Query } from '../../../query';

interface Book extends Entity {
  title?: string;
}

describe('NetworkStore', () => {
  const collectionName = 'books';
  const store = collection<Book>(collectionName, DataStoreType.Network);

  beforeAll(() => {
    init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET,
    });
  });

  beforeAll(async () => {
    nock('https://baas.kinvey.com')
      .post(`/user/${process.env.APP_KEY}/login`, { username: process.env.USERNAME, password: process.env.PASSWORD })
      .reply(200, { _kmd: { authtoken: 'authtoken' } });
    await login(process.env.USERNAME, process.env.PASSWORD);
  });

  describe('save()', () => {
    describe('with API version 4', () => {
      beforeAll(() => setApiVersion(4));

      describe('with an array of entities', () => {
        it('should throw an error', async () => {
          const books = [{}, {}];
          await expect(store.save(books)).rejects.toThrow(
            new Error(
              `Unable to create an array of entities. You are currently using apiVersion ${getApiVersion()}. You can only create an array of entities with apiVersion 5+.`
            )
          );
        });
      });

      describe('with a single entity', () => {
        it('should send a POST request with no _id', async () => {
          nock('https://baas.kinvey.com')
            .post(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .reply(201, { _id: `id` });
          const book = await store.save({});
          nock('https://baas.kinvey.com')
            .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .reply(200, [book]);
          await expect(store.find()).resolves.toEqual([book]);
          nock('https://baas.kinvey.com')
            .delete(`/appdata/${process.env.APP_KEY}/${collectionName}/${book._id}`)
            .reply(200, { count: 1 });
          await store.removeById(book._id);
        });

        it('should send a PUT request with an _id', async () => {
          const newBook = { _id: `id` };
          nock('https://baas.kinvey.com')
            .put(`/appdata/${process.env.APP_KEY}/${collectionName}/${newBook._id}`, newBook)
            .reply(200, newBook);
          const book = await store.save(newBook);
          nock('https://baas.kinvey.com')
            .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .reply(200, [book]);
          await expect(store.find()).resolves.toEqual([book]);
          nock('https://baas.kinvey.com')
            .delete(`/appdata/${process.env.APP_KEY}/${collectionName}/${book._id}`)
            .reply(200, { count: 1 });
          await store.removeById(book._id);
        });
      });
    });

    describe('with API version 5', () => {
      beforeAll(() => setApiVersion(5));

      describe.only('with a single entity', () => {
        it('should send a POST request with no _id', async () => {
          nock('https://baas.kinvey.com')
            .post(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .reply(201, { _id: `id` });
          const book = await store.save({});
          nock('https://baas.kinvey.com')
            .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .reply(200, [book]);
          await expect(store.find()).resolves.toEqual([book]);
          nock('https://baas.kinvey.com')
            .delete(`/appdata/${process.env.APP_KEY}/${collectionName}/${book._id}`)
            .reply(200, { count: 1 });
          await store.removeById(book._id);
        });

        it('should send a PUT request with an _id', async () => {
          const newBook = { _id: `id` };
          nock('https://baas.kinvey.com')
            .put(`/appdata/${process.env.APP_KEY}/${collectionName}/${newBook._id}`, newBook)
            .reply(200, newBook);
          const book = await store.save(newBook);
          nock('https://baas.kinvey.com')
            .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .reply(200, [book]);
          await expect(store.find()).resolves.toEqual([book]);
          nock('https://baas.kinvey.com')
            .delete(`/appdata/${process.env.APP_KEY}/${collectionName}/${book._id}`)
            .reply(200, { count: 1 });
          await store.removeById(book._id);
        });
      });

      describe('with an array of entities', () => {
        it('should send a POST request to with no _id', async () => {
          const newBooks = [{}, {}];
          nock('https://baas.kinvey.com')
            .post(`/appdata/${process.env.APP_KEY}/${collectionName}`, newBooks)
            .reply(201, { entities: [{ _id: '1' }, { _id: '2' }], errors: [] });
          const multiInsertResponse = await store.save(newBooks);
          expect(multiInsertResponse).toHaveProperty('entities');
          expect(multiInsertResponse).toHaveProperty('errors', []);
          const query = new Query().ascending('title');
          nock('https://baas.kinvey.com')
            .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
            .query(query.toQueryObject())
            .reply(200, multiInsertResponse.entities);
          const books = await store.find(query);
          expect(multiInsertResponse.entities).toEqual(books);
          await Promise.all(
            multiInsertResponse.entities.map((book) => {
              nock('https://baas.kinvey.com')
                .delete(`/appdata/${process.env.APP_KEY}/${collectionName}/${book._id}`)
                .reply(200, { count: 1 });
              return store.removeById(book._id);
            })
          );
        });
      });
    });
  });
});

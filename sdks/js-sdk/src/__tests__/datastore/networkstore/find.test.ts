import times from 'lodash/times';
import nock from 'nock';
import { collection, DataStoreType, Entity } from '../../../datastore';
import { init } from '../../../init';
import { login } from '../../../user';
import { Query } from '../../../query';

interface Book extends Entity {
  title: string;
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

  describe('find()', () => {
    let books: Book[];

    beforeAll(async () => {
      const promises = times(2, (i) => {
        const book = { title: `${i}` };
        nock('https://baas.kinvey.com')
          .post(`/appdata/${process.env.APP_KEY}/${collectionName}`)
          .reply(201, { _id: `${i}`, ...book });
        return store.save(book);
      });
      books = await Promise.all(promises);
    });

    afterAll(async () => {
      const promises = books.map((book) => {
        nock('https://baas.kinvey.com')
          .delete(`/appdata/${process.env.APP_KEY}/${collectionName}/${book._id}`)
          .reply(200, { count: 1 });
        return store.removeById(book._id);
      });
      await Promise.all(promises);
    });

    it('should return all of the entities', async () => {
      const query = new Query().ascending('title');
      nock('https://baas.kinvey.com')
        .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
        .query(query.toQueryObject())
        .reply(200, books);
      const entities = await store.find(query);
      expect(entities).toEqual(books);
    });
  });
});

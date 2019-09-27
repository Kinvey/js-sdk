import { Sync } from '../sync';
import { SyncOperation } from '../cache';

const collectionName = 'test';

jest.mock('@progresskinvey/js-sdk-init');

afterEach(() => jest.restoreAllMocks());

describe('Sync', () => {
  describe('addCreateOperation()', () => {
    it('should throw an error if an entity is missing and _id', async () => {
      const entity = {};
      const sync = new Sync(collectionName);
      await expect(sync.addCreateOperation([entity])).rejects.toThrow(
        new Error('An entity is missing an _id. All entities must have an _id in order to be added to the sync queue.')
      );
    });

    it('should call addOperation with the correct arguments', async () => {
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync, 'addOperation');
      await sync.addCreateOperation([]);
      expect(spy).toHaveBeenCalledWith(SyncOperation.Create, []);
    });

    it('should add entities to the queue', async () => {
      const entity = { _id: '1' };
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync.syncCache, 'save').mockImplementation((entities) => Promise.resolve(entities));
      const results = await sync.addCreateOperation([entity]);
      expect(results).toEqual([
        {
          entityId: entity._id,
          entity,
          collection: collectionName,
          state: {
            operation: SyncOperation.Create,
          },
        },
      ]);
      expect(spy).toHaveBeenCalledWith([
        {
          entityId: entity._id,
          entity,
          collection: collectionName,
          state: {
            operation: SyncOperation.Create,
          },
        },
      ]);
    });
  });

  describe('addUpdateOperation()', () => {
    it('should throw an error if an entity is missing and _id', async () => {
      const entity = {};
      const sync = new Sync(collectionName);
      await expect(sync.addUpdateOperation([entity])).rejects.toThrow(
        new Error('An entity is missing an _id. All entities must have an _id in order to be added to the sync queue.')
      );
    });

    it('should call addOperation with the correct arguments', async () => {
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync, 'addOperation');
      await sync.addUpdateOperation([]);
      expect(spy).toHaveBeenCalledWith(SyncOperation.Update, []);
    });

    it('should add entities to the queue', async () => {
      const entity = { _id: '1' };
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync.syncCache, 'save').mockImplementation((entities) => Promise.resolve(entities));
      const results = await sync.addUpdateOperation([entity]);
      expect(results).toEqual([
        {
          entityId: entity._id,
          entity,
          collection: collectionName,
          state: {
            operation: SyncOperation.Update,
          },
        },
      ]);
      expect(spy).toHaveBeenCalledWith([
        {
          entityId: entity._id,
          entity,
          collection: collectionName,
          state: {
            operation: SyncOperation.Update,
          },
        },
      ]);
    });
  });

  describe('addDeleteOperation()', () => {
    it('should throw an error if an entity is missing and _id', async () => {
      const entity = {};
      const sync = new Sync(collectionName);
      await expect(sync.addDeleteOperation([entity])).rejects.toThrow(
        new Error('An entity is missing an _id. All entities must have an _id in order to be added to the sync queue.')
      );
    });

    it('should call addOperation with the correct arguments', async () => {
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync, 'addOperation');
      await sync.addDeleteOperation([]);
      expect(spy).toHaveBeenCalledWith(SyncOperation.Delete, []);
    });

    it('should not add entities to the queue that were created offline', async () => {
      const entity = { _id: '1', _kmd: { local: true } };
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync.syncCache, 'save');
      await sync.addDeleteOperation([entity]);
      expect(spy).toHaveBeenCalledWith([]);
    });

    it('should add entities to the queue', async () => {
      const entity = { _id: '1' };
      const sync = new Sync(collectionName);
      // @ts-ignore
      const spy = jest.spyOn(sync.syncCache, 'save').mockImplementation((entities) => Promise.resolve(entities));
      const results = await sync.addDeleteOperation([entity]);
      expect(results).toEqual([
        {
          entityId: entity._id,
          entity,
          collection: collectionName,
          state: {
            operation: SyncOperation.Delete,
          },
        },
      ]);
      expect(spy).toHaveBeenCalledWith([
        {
          entityId: entity._id,
          entity,
          collection: collectionName,
          state: {
            operation: SyncOperation.Delete,
          },
        },
      ]);
    });
  });

  describe('push()', () => {
    it('should handle SyncOperation.Create', async () => {
      const entity = { _id: '1', _kmd: {} };
      const syncEntity = {
        _id: '1',
        entityId: entity._id,
        entity,
        collection: collectionName,
        state: {
          operation: SyncOperation.Create,
        },
      };

      const sync = new Sync(collectionName);
      // @ts-ignore
      const networkSpy = jest.spyOn(sync.network, 'create').mockImplementation(() => Promise.resolve({ data: entity }));
      // @ts-ignore
      const syncCacheSpy = jest.spyOn(sync.syncCache, 'removeById').mockImplementation(() => Promise.resolve());
      // @ts-ignore
      const cacheFindByIdSpy = jest.spyOn(sync.cache, 'findById').mockImplementation(() => Promise.resolve(entity));
      // @ts-ignore
      const cacheSaveSpy = jest.spyOn(sync.cache, 'save').mockImplementation(() => Promise.resolve());

      const results = await sync.push([syncEntity]);

      expect(results).toEqual([{ _id: syncEntity.entityId, operation: SyncOperation.Create, entity }]);
      expect(networkSpy).toHaveBeenCalledWith(entity, undefined);
      expect(syncCacheSpy).toHaveBeenCalledWith(syncEntity._id);
      expect(cacheFindByIdSpy).toHaveBeenCalledWith(syncEntity.entityId);
      expect(cacheSaveSpy).toHaveBeenCalledWith(entity);
    });

    it('should handle SyncOperation.Update', async () => {
      const entity = { _id: '1', _kmd: {} };
      const syncEntity = {
        _id: '1',
        entityId: entity._id,
        entity,
        collection: collectionName,
        state: {
          operation: SyncOperation.Update,
        },
      };

      const sync = new Sync(collectionName);
      // @ts-ignore
      const networkSpy = jest.spyOn(sync.network, 'update').mockImplementation(() => Promise.resolve({ data: entity }));
      // @ts-ignore
      const syncCacheSpy = jest.spyOn(sync.syncCache, 'removeById').mockImplementation(() => Promise.resolve());
      // @ts-ignore
      const cacheFindByIdSpy = jest.spyOn(sync.cache, 'findById').mockImplementation(() => Promise.resolve(entity));
      // @ts-ignore
      const cacheSaveSpy = jest.spyOn(sync.cache, 'save').mockImplementation(() => Promise.resolve());

      const results = await sync.push([syncEntity]);

      expect(results).toEqual([{ _id: syncEntity.entityId, operation: SyncOperation.Update, entity }]);
      expect(networkSpy).toHaveBeenCalledWith(entity, undefined);
      expect(syncCacheSpy).toHaveBeenCalledWith(syncEntity._id);
      expect(cacheFindByIdSpy).toHaveBeenCalledWith(syncEntity.entityId);
      expect(cacheSaveSpy).toHaveBeenCalledWith(entity);
    });

    it('should handle SyncOperation.Delete', async () => {
      const entity = { _id: '1' };
      const syncEntity = {
        _id: '1',
        entityId: entity._id,
        entity,
        collection: collectionName,
        state: {
          operation: SyncOperation.Delete,
        },
      };
      const sync = new Sync(collectionName);
      // @ts-ignore
      const networkSpy = jest.spyOn(sync.network, 'removeById').mockImplementation(() => Promise.resolve());
      // @ts-ignore
      const syncCacheSpy = jest.spyOn(sync.syncCache, 'removeById').mockImplementation(() => Promise.resolve());

      const results = await sync.push([syncEntity]);

      expect(results).toEqual([
        {
          _id: syncEntity.entityId,
          operation: SyncOperation.Delete,
        },
      ]);
      expect(networkSpy).toHaveBeenCalledWith(syncEntity.entityId, undefined);
      expect(syncCacheSpy).toHaveBeenCalledWith(syncEntity._id);
    });
  });
});

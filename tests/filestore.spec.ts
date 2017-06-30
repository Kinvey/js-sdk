import fs = require('fs');
import path = require('path');
import nock = require('nock');
import expect = require('expect');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import merge = require('lodash/merge');

import { File, FileStore } from '../src/datastore/filestore';
import { KinveyError, NotFoundError, ServerError } from '../src/errors';
import { randomString } from '../src/utils/string';
import { Query } from '../src/datastore/query';

chai.use(chaiAsPromised);
chai.should();

describe('FileStore', () => {
  describe('find()', () => {
    it('should find the files', (done) => {
      const store = new FileStore();
      const file1 = { _id: randomString() };
      const file2 = { _id: randomString() };
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file1, file2]);

      return store.find()
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([[file1, file2]]);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should throw an error if the query is not an instance of the Query class', (done) => {
      const store = new FileStore();
      store.find({})
        .subscribe(null, (error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
          done();
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should find the files that match the query', (done) => {
      const store = new FileStore();
      const file = { _id: randomString() };
      const query = new Query();
      query.equalTo('_id', file._id);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query(merge({ tls: true }, query.toQueryString()))
        .reply(200, [file]);

      return store.find(query)
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([[file]]);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should set tls to true by default', (done) => {
      const store = new FileStore();
      const file = { _id: randomString() };
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find()
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([[file]]);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should set tls to false', (done) => {
      const store = new FileStore();
      const file = { _id: randomString() };
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: false })
        .reply(200, [file]);

      return store.find(null, { tls: false })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([[file]]);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not set ttl if it is not a number', (done) => {
      const store = new FileStore();
      const file = { _id: randomString() };
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find(null, { ttl: {} })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([[file]]);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should set ttl to 10 seconds', (done) => {
      const store = new FileStore();
      const file = { _id: randomString() };
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, [file]);

      return store.find(null, { ttl: 10 })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([[file]]);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should download the files', (done) => {
      const store = new FileStore();
      const downloadByUrlSpy = expect.spyOn(store, 'downloadByUrl');
      const file = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find(null, { download: true })
        .subscribe(null, done, () => {
          try {
            expect(downloadByUrlSpy).toHaveBeenCalled();
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not download the files', (done) => {
      const store = new FileStore();
      const downloadByUrlSpy = expect.spyOn(store, 'downloadByUrl');
      const file = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find(null, { download: false })
        .subscribe(null, done, () => {
          try {
            expect(downloadByUrlSpy).toNotHaveBeenCalled();
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });

  describe('download()', () => {
    it('should set tls to true by default', (done) => {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'https://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id)
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy).toHaveBeenCalledWith(file);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should set tls to false', (done) => {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: false })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { tls: false })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy).toHaveBeenCalledWith(file);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not set ttl if it is not a number', (done) => {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'https://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { ttl: {} })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy).toHaveBeenCalledWith(file);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should set ttl to 10 seconds', (done) => {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'https://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { ttl: 10 })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy).toHaveBeenCalledWith(file);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should stream the file', (done) => {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'https://tests.com' };
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      return store.download(fileEntity._id, { stream: true })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy).toHaveBeenCalledWith(fileEntity);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not stream the file', (done) => {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'https://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { stream: false })
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy).toHaveBeenCalledWith(file);
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });

  describe('findById()', () => {
    it('should call download() with id', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      const id = randomString();
      store.findById(id);
      expect(spy).toHaveBeenCalledWith(id, {});
    });

    it('should call download() with options', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      const options = { foo: randomString() };
      store.findById(null, options);
      expect(spy).toHaveBeenCalledWith(null, options);
    });
  });

  describe('stream()', () => {
    it('should call download() with id', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      const id = randomString();
      store.stream(id);
      expect(spy).toHaveBeenCalledWith(id, { stream: true });
    });

    it('should call download() with options.stream = true if it was set to false', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      store.stream(null, { stream: false });
      expect(spy).toHaveBeenCalledWith(null, { stream: true });
    });
  });

  describe('upload()', () => {
    it('should upload a file', () => {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const fileSize = file.length;

      // Kinvey API response
      nock(store.client.apiHostname)
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        });

      // GCS status check response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS complete response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(200, {
          kind: 'storage#object',
          id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000',
          selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/279af537-39a3-4f50-a578-0b5a639c04a2%2Fkinvey.png',
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          bucket: '5d91e6b552d148188e30d8eb106da6d8',
          generation: '1471377776175000',
          metageneration: '1',
          contentType: 'image/png',
          timeCreated: '2016-08-16T20:02:56.170Z',
          updated: '2016-08-16T20:02:56.170Z',
          storageClass: 'STANDARD',
          size: '24181',
          md5Hash: 'uDj9xHXl0fJiJdNitgQHUA==',
          mediaLink: 'https://www.googleapis.com/download/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png?generation=1471377776175000&alt=media',
          cacheControl: 'private, max-age=0, no-transform',
          acl: [{
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            role: 'OWNER',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            etag: 'CJjPt63dxs4CEAE='
          }, {
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/allUsers',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/allUsers',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'allUsers',
            role: 'READER',
            etag: 'CJjPt63dxs4CEAE='
          }],
          owner: {
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f'
          },
          crc32c: 'ghJtBQ==',
          etag: 'CJjPt63dxs4CEAE='
        }, {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q',
          'content-type': 'application/json; charset=UTF-8',
          'content-length': '2503'
        });

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
          return data;
        });
      return promise.should.be.fulfilled;
    });

    it('should resume a file upload when a 308 status code is received', () => {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const fileSize = file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS complete response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(200, {
          kind: 'storage#object',
          id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000',
          selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/279af537-39a3-4f50-a578-0b5a639c04a2%2Fkinvey.png',
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          bucket: '5d91e6b552d148188e30d8eb106da6d8',
          generation: '1471377776175000',
          metageneration: '1',
          contentType: 'image/png',
          timeCreated: '2016-08-16T20:02:56.170Z',
          updated: '2016-08-16T20:02:56.170Z',
          storageClass: 'STANDARD',
          size: '24181',
          md5Hash: 'uDj9xHXl0fJiJdNitgQHUA==',
          mediaLink: 'https://www.googleapis.com/download/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png?generation=1471377776175000&alt=media',
          cacheControl: 'private, max-age=0, no-transform',
          acl: [{
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            role: 'OWNER',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            etag: 'CJjPt63dxs4CEAE='
          }, {
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/allUsers',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/allUsers',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'allUsers',
            role: 'READER',
            etag: 'CJjPt63dxs4CEAE='
          }],
          owner: {
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f'
          },
          crc32c: 'ghJtBQ==',
          etag: 'CJjPt63dxs4CEAE='
        }, {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q',
          'content-type': 'application/json; charset=UTF-8',
          'content-length': '2503'
        });

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
      return promise.should.be.fulfilled;
    });

    it('should resume a file upload when a 5xx status code is received', () => {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const fileSize = file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS error response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(500, 'ServerError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS complete response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(200, {
          kind: 'storage#object',
          id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000',
          selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/279af537-39a3-4f50-a578-0b5a639c04a2%2Fkinvey.png',
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          bucket: '5d91e6b552d148188e30d8eb106da6d8',
          generation: '1471377776175000',
          metageneration: '1',
          contentType: 'image/png',
          timeCreated: '2016-08-16T20:02:56.170Z',
          updated: '2016-08-16T20:02:56.170Z',
          storageClass: 'STANDARD',
          size: '24181',
          md5Hash: 'uDj9xHXl0fJiJdNitgQHUA==',
          mediaLink: 'https://www.googleapis.com/download/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png?generation=1471377776175000&alt=media',
          cacheControl: 'private, max-age=0, no-transform',
          acl: [{
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            role: 'OWNER',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            etag: 'CJjPt63dxs4CEAE='
          }, {
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/allUsers',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/allUsers',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'allUsers',
            role: 'READER',
            etag: 'CJjPt63dxs4CEAE='
          }],
          owner: {
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f'
          },
          crc32c: 'ghJtBQ==',
          etag: 'CJjPt63dxs4CEAE='
        }, {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q',
          'content-type': 'application/json; charset=UTF-8',
          'content-length': '2503'
        });

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
      return promise.should.be.fulfilled;
    });

    it('should fail to upload a file when a 5xx status code is received mutiple times', () => {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const fileSize = file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS error response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .times(15)
        .reply(500, 'ServerError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      }, {
        maxBackoff: 250
      })
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.code).toEqual(500);
          throw error;
        });
      return promise.should.be.rejected;
    });

    it('should fail to upload a file when a 4xx status code is received', () => {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/test.png'), 'utf8');
      const fileSize = file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS error response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(404, 'NotFoundError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      }, {
        maxBackoff: 250
      })
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
          expect(error.code).toEqual(404);
          throw error;
        });
      return promise.should.be.rejected;
    });
  });

  describe('create()', () => {
    it('should call upload() with file', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const file = randomString();
      store.create(file);
      expect(spy).toHaveBeenCalledWith(file, undefined, undefined);
    });

    it('should call upload() with metadata', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const metadata = randomString();
      store.create(null, metadata);
      expect(spy).toHaveBeenCalledWith(null, metadata, undefined);
    });

    it('should call upload() with options', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const options = randomString();
      store.create(null, null, options);
      expect(spy).toHaveBeenCalledWith(null, null, options);
    });
  });

  describe('update()', () => {
    it('should call upload() with file', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const file = randomString();
      store.update(file);
      expect(spy).toHaveBeenCalledWith(file, undefined, undefined);
    });

    it('should call upload() with metadata', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const metadata = randomString();
      store.update(null, metadata);
      expect(spy).toHaveBeenCalledWith(null, metadata, undefined);
    });

    it('should call upload() with options', () => {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const options = randomString();
      store.update(null, null, options);
      expect(spy).toHaveBeenCalledWith(null, null, options);
    });
  });

  describe('removeById()', () => {
    it('should throw a NotFoundError if the id does not exist', () => {
      const store = new FileStore();
      const _id = randomString();

      nock(store.client.apiHostname)
        .delete(`${store.pathname}/${_id}`)
        .reply(404);

      return store.removeById(_id)
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should remove the entity that matches the id', () => {
      const store = new FileStore();
      const _id = randomString();
      const reply = { count: 1 };

      nock(store.client.apiHostname)
        .delete(`${store.pathname}/${_id}`)
        .reply(200, reply);

      return store.removeById(_id)
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });
  });
});
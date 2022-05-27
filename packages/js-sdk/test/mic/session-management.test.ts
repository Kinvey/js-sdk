import nock from 'nock';
import { expect } from 'chai';

import * as Kinvey from '../../lib'
import * as httpAdapter from '../http';
import * as memoryStorageAdapter from '../memory';
import * as sessionStore from '../sessionStore';

function getRandomStr(prefix: string): string {
  return `${prefix}-${String(Math.random()).substring(2)}`;
}

function getCollectionURI(appKey: string, collectionName: string): string {
  return `/appdata/${appKey}/${collectionName}`;
}

describe('Session management', () => {
  beforeAll(() => {
    this.appKey = getRandomStr('appKey');
    this.collectionName = getRandomStr('collection');
    this.instanceId = getRandomStr('instanceId');

    this.kcsURL = `https://${this.instanceId}-baas.kinvey.com`;
    this.kasURL = `https://${this.instanceId}-auth.kinvey.com`
  });

  beforeAll(() => {
    Kinvey.init({
      kinveyConfig: {
        appKey: this.appKey,
        appSecret: getRandomStr('appSecret'),
        instanceId: this.instanceId

      },
      httpAdapter,
      sessionStore: sessionStore,
      popup: null,
      storageAdapter: memoryStorageAdapter,
      pubnub: null
    });
  });

  beforeEach(async () => {
    this.session = {
      _kmd: {
        authtoken: getRandomStr('authtoken')
      },
      _socialIdentity: {
        kinveyAuth: {
          identity: 'kinveyAuth',
          access_token: getRandomStr('accessToken'),
          refresh_token: getRandomStr('refreshToken'),
          client_id: getRandomStr('clientId'),
          redirect_uri: getRandomStr('redirectURI'),
        }
      }
    };

    await sessionStore.set(`${this.appKey}.active_user`, JSON.stringify(this.session));
    this.store = Kinvey.DataStore.collection(this.collectionName, Kinvey.DataStoreType.Network);
  });

  afterEach(() => {
    expect(nock.isDone()).to.be.true;
  });

  describe('when session has expired', () => {
    beforeEach(() => {
      nock(this.kcsURL)
        .get(getCollectionURI(this.appKey, this.collectionName))
        .times(1)
        .reply(401, { name: 'InvalidCredentials' });
    });

    beforeEach(() => {
      this.newAccessToken = getRandomStr('newAccessToken');
      this.newRefreshToken = getRandomStr('newRefreshToken');
    });

    it('should refresh tokens', async () => {
      const successfulDataResponse = [{ _id: getRandomStr('entityId') }];
      const newAuthToken = getRandomStr('newAuthtoken')

      nock(this.kcsURL)
        .get(getCollectionURI(this.appKey, this.collectionName))
        .times(1)
        .reply(200, successfulDataResponse);

      nock(this.kcsURL)
        .post(`/user/${this.appKey}/login`)
        .times(1)
        .reply(200, {
          _kmd: {
            authtoken: newAuthToken
          },
          _socialIdentity: {
            kinveyAuth: {
              identity: 'kinveyAuth',
              access_token: this.newAccessToken,
              refresh_token: this.newRefreshToken,
              client_id: getRandomStr('newClientId'),
              redirect_uri: getRandomStr('newRedirectURI'),
            }
          }
        });

      nock(this.kasURL)
        .post('/oauth/token')
        .times(1)
        .reply(200, { access_token: this.newAccessToken, refresh_token: this.newRefreshToken });


      const response = await this.store.find().toPromise();
      expect(response).to.deep.equal(successfulDataResponse);

      const sessionStr = await sessionStore.get(`${this.appKey}.active_user`);
      expect(sessionStr).to.exist;

      const session = JSON.parse(sessionStr);
      expect(session).to.have.nested.property('_kmd.authtoken', newAuthToken)
      expect(session).to.have.nested.property('_socialIdentity.kinveyAuth.access_token', this.newAccessToken)
      expect(session).to.have.nested.property('_socialIdentity.kinveyAuth.refresh_token', this.newRefreshToken)
    });

    it('should reuse refresh token if refresh request fails', async () => {
      nock(this.kasURL)
        .post('/oauth/token')
        .times(1)
        .reply(400);

      try {
        await this.store.find().toPromise();
        throw new Error('should not happen');
      } catch (err) {
        expect(err.name).to.equal('InvalidCredentialsError');
      }

      const sessionStr = await sessionStore.get(`${this.appKey}.active_user`);
      expect(sessionStr).to.exist;

      const session = JSON.parse(sessionStr);
      expect(session).to.have.nested.property('_socialIdentity.kinveyAuth.access_token', this.session._socialIdentity.kinveyAuth.access_token)
      expect(session).to.have.nested.property('_socialIdentity.kinveyAuth.refresh_token', this.session._socialIdentity.kinveyAuth.refresh_token)
    });

    it('should persist refreshed tokens before making a login request to KCS', async () => {
      nock(this.kasURL)
        .post('/oauth/token')
        .times(1)
        .reply(200, { access_token: this.newAccessToken, refresh_token: this.newRefreshToken });

      nock(this.kcsURL)
        .post(`/user/${this.appKey}/login`)
        .times(1)
        .reply(401, { name: 'InvalidCredentials' });

      try {
        await this.store.find().toPromise();
        throw new Error('should not happen');
      } catch (err) {
        expect(err.name).to.equal('InvalidCredentialsError');
      }

      const sessionStr = await sessionStore.get(`${this.appKey}.active_user`);
      expect(sessionStr).to.exist;

      const session = JSON.parse(sessionStr);
      expect(session).to.have.nested.property('_socialIdentity.kinveyAuth.access_token', this.newAccessToken)
      expect(session).to.have.nested.property('_socialIdentity.kinveyAuth.refresh_token', this.newRefreshToken)
    });
  });
});

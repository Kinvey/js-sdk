import { ActiveUserError, KinveyError } from '../errors';
import Model from './model';
import Client from '../client';
import NetworkRequest from '../requests/networkRequest';
import { NotFoundError } from '../errors';
import { HttpMethod, ReadPolicy as DataPolicy, WritePolicy, SocialIdentity } from '../enums';
import Query from '../query';
import Auth from '../auth';
import UserUtils from '../utils/user';
import MobileIdentityConnect from '../mic';
import hello from 'hellojs';
import isObject from 'lodash/lang/isObject';
import result from 'lodash/object/result';
import assign from 'lodash/object/assign';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const micAuthProvider = process.env.KINVEY_MIC_AUTH_PROVIDER || 'kinveyAuth';

export default class User extends Model {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * The pathname for the users where requests will be sent.
   *
   * @return   {string}    Pathname
   */
  getPathname(client) {
    client = client || this.client;
    return `/${usersNamespace}/${client.appKey}`;
  }

  /**
   * The pathname for the rpc where requests will be sent.
   *
   * @return   {string}    Pathname
   */
  getRpcPathname(client) {
    client = client || this.client;
    return `/${rpcNamespace}/${client.appKey}`;
  }

  /**
   * Active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static getActive(options = {}) {
    const promise = UserUtils.getActive(options).then(data => {
      if (data) {
        return new User(data);
      }

      return null;
    });

    return promise;
  }

  /**
   * Stores the active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static setActive(user, options = {}) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user));
    }

    const promise = UserUtils.setActive(user, options).then(data => {
      if (data) {
        return new User(data);
      }

      return null;
    });

    return promise;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Promise} Resolved with `true` if the user is active, `false` otherwise.
   */
  isActive(options = {}) {
    return User.getActive(options).then(user => {
      if (user) {
        return this.id === user.id;
      }

      return false;
    });
  }

  /**
   * Login a user. A promise will be returned that will be resolved with a
   * user or rejected with an error.
   *
   * @param   {string|Object} usernameOrData Username or login data
   * @param   {string} [password] Password
   * @param   {Options} [options] Options
   * @return  {Promise} Promise
   *
   * @example
   * Kinvey.User.login('admin', 'admin').then(function(user) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  static login(usernameOrData, password, options = {}) {
    if (!isObject(usernameOrData)) {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    const user = new User(usernameOrData);
    return user.login(options);
  }

  login(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = User.getActive(options).then(activeUser => {
      if (activeUser) {
        throw new ActiveUserError('A user is already logged in.');
      }

      const username = this.get('username');
      const password = this.get('password');
      const _socialIdentity = this.get('_socialIdentity');
      if ((!username || username === '' || !password || password === '') && !_socialIdentity) {
        throw new KinveyError(
          'Username and/or password missing. Please provide both a username and password to login.'
        );
      }

      const request = new NetworkRequest({
        method: HttpMethod.POST,
        pathname: `${this.getPathname(this.client)}/login`,
        data: this.toJSON(),
        auth: Auth.app,
        client: options.client
      });
      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        this.set(response.data, options);
        this.unset('password');
        return User.setActive(this, options);
      }

      return response;
    });

    return promise;
  }

  static connectWithFacebook(user, options = {}) {
    return User.connectWithSocial(SocialIdentity.Facebook, user, options);
  }

  static connectWithGoogle(user, options = {}) {
    return User.connectWithSocial(SocialIdentity.Google, user, options);
  }

  static connectWithLinkedIn(user, options = {}) {
    return User.connectWithSocial(SocialIdentity.LinkedIn, user, options);
  }

  static connectWithSocial(identity, user, options = {}) {
    options = assign({
      client: Client.sharedInstance(),
      auth: Auth.default,
      collectionName: 'SocialIdentities',
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const query = new Query();
      query.equalTo('identity', identity);
      const request = new NetworkRequest({
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `/${appdataNamespace}/${options.client.appKey}/${options.collectionName}`,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        if (response.data.length === 1) {
          const helloSettings = {};
          helloSettings[identity] = response.data[0].key || response.data[0].appId || response.data[0].clientId;
          hello.init(helloSettings);
          return hello(identity).login();
        }

        throw new Error('Unsupported social identity');
      }

      throw response.error;
    }).then(() => {
      const authResponse = hello(identity).getAuthResponse();
      return User.connect(user, authResponse.access_token, authResponse.expires_in, identity, options);
    });

    return promise;
  }

  static connectWithMIC(redirectUri, authorizationGrant, user, options = {}) {
    const mic = new MobileIdentityConnect();
    const promise = mic.login(redirectUri, authorizationGrant, options).then(token => {
      return User.connect(user, token.access_token, token.expires_in, micAuthProvider, options);
    });

    return promise;
  }

  static connect(user = {}, accessToken, expiresIn, identity, options = {}) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user));
    }
    return user.connect(accessToken, expiresIn, identity, options);
  }

  connect(accessToken, expiresIn, identity, options = {}) {
    const socialIdentity = {};
    socialIdentity[identity] = {
      access_token: accessToken,
      expires_in: expiresIn
    };
    this.set('_socialIdentity', socialIdentity);

    const promise = this.isActive().then(active => {
      if (active) {
        return this.update(options);
      }

      return this.login(options);
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return this.signup(options).then(() => {
          return this.connect(accessToken, expiresIn, identity, options);
        });
      }

      throw err;
    });

    return promise;
  }

  /**
   * Logout the active user. A promise will be returned that will be resolved
   * with null or rejected with an error.
   *
   * @param {Object} [options] Options
   * @return  {Promise} Promise
   *
   * @example
   * var user = Kinvey.User.getActive();
   * user.logout().then(function() {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  logout(options = {}) {
    options = assign({
      client: this.client,
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const promise = this.isActive(options).then(active => {
      if (!active) {
        return null;
      }

      const request = new NetworkRequest({
        method: HttpMethod.POST,
        client: options.client,
        properties: options.properties,
        auth: Auth.session,
        pathname: `${this.getPathname(options.client)}/_logout`,
        timeout: options.timeout
      });
      return request.execute();
    }).then(() => {
      return User.setActive(null, options.client);
    });

    return promise;
  }

  static signup(user, options = {}) {
    if (!user) {
      return Promise.reject(new Error('User is required.'));
    }

    if (!(user instanceof User)) {
      user = new User(result(user, 'toJSON', user));
    }

    return user.signup(options);
  }

  signup(options = {}) {
    options = assign({
      client: this.client,
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      client: options.client,
      properties: options.properties,
      auth: Auth.app,
      pathname: this.getPathname(this.client),
      data: this.toJSON(),
      timeout: options.timeout
    });
    const promise = request.execute().then(response => {
      if (response.isSuccess()) {
        this.set(response.data);
        return this;
      }

      throw response.error;
    });

    return promise;
  }

  update(options = {}) {
    options = assign({
      client: this.client,
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    // const socialIdentity = this.get('_socialIdentity');
    // const tokens = [];

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    // if (socialIdentity) {
    //   for (const identity of socialIdentity) {
    //     if (socialIdentity.hasOwnProperty(identity)) {
    //       if (socialIdentity[identity] && identity !== options._provider) {
    //         tokens.push({
    //           provider: identity,
    //           access_token: socialIdentity[identity].access_token,
    //           access_token_secret: socialIdentity[identity].access_token_secret
    //         });
    //         delete socialIdentity[identity].access_token;
    //         delete socialIdentity[identity].access_token_secret;
    //       }
    //     }
    //   }
    // }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    // user.set('_socialIdentity', socialIdentity);

    const request = new NetworkRequest({
      method: HttpMethod.PUT,
      client: options.client,
      properties: options.properties,
      auth: Auth.session,
      pathname: `${this.getPathname(this.client)}/${this.id}`,
      data: this.toJSON(),
      timeout: options.timeout
    });
    const promise = request.execute().then(response => {
      if (response.isSuccess()) {
        return this.isActive();
      }

      throw response.error;
    }).then(active => {
      if (active) {
        return User.setActive(this, options);
      }

      return this;
    });

    return promise;
  }

  me(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = this.isActive(options).then(active => {
      if (!active) {
        throw new KinveyError('User is not active. Please login first.');
      }

      const request = new NetworkRequest({
        method: HttpMethod.GET,
        pathname: `${this.getPathname(options.client)}/_me`,
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.session,
        client: options.client
      });
      return request.execute();
    }).then(response => {
      const user = new User(response.data);

      if (!user.kmd.authtoken) {
        return User.getActive().then(activeUser => {
          const kmd = user.kmd;
          kmd.authtoken = activeUser.kmd.authtoken;
          user.kmd = kmd;
          return user;
        });
      }

      return user;
    }).then(user => {
      return User.setActive(user, options.client);
    });

    return promise;
  }

  verifyEmail(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/${this.get('username')}/user-email-verification-initiate`,
      writePolicy: WritePolicy.Network,
      auth: Auth.app,
      client: options.client
    });
    const promise = request.execute();
    return promise;
  }

  forgotUsername(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/user-forgot-username`,
      writePolicy: WritePolicy.Network,
      auth: Auth.app,
      client: options.client,
      data: { email: this.get('email') }
    });
    const promise = request.execute();
    return promise;
  }

  resetPassword(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/${this.get('username')}/user-password-reset-initiate`,
      writePolicy: WritePolicy.Network,
      auth: Auth.app,
      client: options.client
    });
    const promise = request.execute();
    return promise;
  }
}

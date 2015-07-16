import HttpMethod from '../enums/httpMethod';
import Entity from './entity';
import {isDefined} from './utils';
import Request from './request';
import AuthType from '../enums/authType';
import CacheManager from './cacheManager';
import log from 'loglevel';
import Kinvey from '../kinvey';
import isFunction from 'lodash/lang/isFunction';
import isObject from 'lodash/lang/isObject';
import DataPolicy from '../enums/dataPolicy';
const activeUserSymbol = Symbol();
const activeUserKey = 'activeUser';

class User extends Entity {
  get username() {
    return this.data.username;
  }

  get password() {
    return this.data.password;
  }

  get authtoken() {
    return this._kmd.authtoken;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Boolean} `true` if the user is active, `false` otherwise.
   */
  isActive() {
    let activeUser = User.getActive();

    if (isDefined(activeUser)) {
      return this.data._id === activeUser.data._id;
    }

    return false;
  }

  /**
   * Logs out the user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  logout () {
    let promise = Promise.resolve();

    // If this is not the current user then just resolve
    if (!this.isActive()) {
      return Promise.resolve();
    }

    // Debug
    log.info('Logging out the active user.');

    // // Create a request
    // let request = new Request(HttpMethod.POST, `/user/${kinvey.appKey}/_logout`);

    // // Set the auth type
    // request.authType = AuthType.Session;

    // // Execute the request
    // let promise = request.execute(options).catch((response) => {
    //   let error = response.data;

    //   if (error.name === INVALID_CREDENTIALS || error.name === EMAIL_VERIFICATION_REQUIRED) {
    //     // Debug
    //     log.warn('The user credentials are invalid.');

    //     return null;
    //   }

    //   return Promise.reject(response);
    // }).then(() => {
    //   // Reset the active user.
    //   let previous = kinvey.activeUser = null;

    //   // Delete the auth token
    //   if (utils.isDefined(previous)) {
    //     delete previous._kmd.authtoken;
    //   }

    //   // Return the previous
    //   return previous;
    // });
    //

    // Set the active user to null
    User.setActive(null);

    // Debug
    promise.then(() => {
      log.info(`Logged out the active user.`);
    }).catch(() => {
      log.error(`Failed to logout the active user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Logs out the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  static logout() {
    let user = User.getActive();

    if (isDefined(user)) {
      return user.logout();
    }

    return Promise.resolve();
  }

  /**
   * Retrieves information on the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The active user.
   */
  me(options = {}) {
    let kinvey = Kinvey.instance();

    // Debug
    log.info('Retrieving information on the active user.');

    // Create a request
    let request = new Request(HttpMethod.GET, `/user/${kinvey.appKey}/_me`);

    // Set the auth type
    request.auth = AuthType.Session;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // The response.data is a fresh copy of the active user. However, the response
      // does not contain `_kmd.authtoken`. Therefore, extract it from the
      // stale copy.
      response.data._kmd.authtoken = this.data._kmd.authtoken;

      // Set the data for the user
      this.data = response.data;

      // Return the user
      return this.toJSON();
    });

    // Debug
    promise.then(() => {
      log.info(`Retrieved information on the active user.`);
    }).catch(() => {
      log.error(`Failed to retrieve information on the active user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Retrieves information on the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The active user.
   */
  static me(options = {}) {
    // Forward to `user.me()`.
    let user = User.getActive();

    if (isDefined(user)) {
      return user.me(options);
    }

    return Promise.reject('No Active User');
  }

  /**
   * Requests a password reset for a user.
   *
   * @param   {String}  username  Username.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  resetPassword(username, options = {}) {
    let kinvey = Kinvey.instance();

    // Debug
    log.info('Requesting a password reset.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${kinvey.appKey}/${username}/user-password-reset-initiate`);

    // Set the auth type
    request.auth = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then(() => {
      log.info(`Requested a password reset.`);
    }).catch(() => {
      log.error(`Failed to request a password reset.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Signs up a new user.
   *
   * @param   {Object}  [data]    User data.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The new user.
   */
  static signup(data, options = {}) {
    // Debug
    log.info('Signing up a new user.');

    // Forward to `User.create()`. Signup always marks the created
    // user as the active user
    options.state = true;
    return User.create(data, options);
  }

  /**
   * Signs up a new user through a provider.
   *
   * @param {String}    provider  Provider.
   * @param {Object}    tokens    Tokens.
   * @param {Object}    [options] Options.
   * @returns {Promise}           The active user.
   */
  static signupWithProvider(provider, tokens, options = {}) {
    // Debug
    log.info('Signing up a new user with a provider.');

    // Parse tokens
    let data = {_socialIdentity: {}};
    data._socialIdentity[provider] = tokens;

    // Forward to `User.signup()`.
    return User.signup(data, options);
  }

  /**
   * Creates a new user.
   *
   * @param   {Object}  [data]                User data.
   * @param   {Options} [options]             Options.
   * @param   {Boolean} [options.state=true]  Save the created user as the active
   *                                          user.
   * @returns {Promise}                       The new user.
   */
  static create(data = {}, options = {}) {
    let kinvey = Kinvey.instance();

    // Debug
    log.info('Creating a new user.');

    // Validate preconditions
    if (options.state !== false && isDefined(User.getActive())) {
      let error = new Error('Already logged in.');
      return Promise.reject(error);
    }

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${kinvey.appKey}`, null, data);

    // Set the data policy
    request.dataPolicy = DataPolicy.CloudFirst;

    // Set the auth type
    request.auth = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the active
      if (options.state !== false) {
        User.setActive(user);
      }

      // Return the user
      return user.toJSON();
    });

    // Debug
    promise.then(() => {
      log.info(`Created the new user.`);
    }).catch(() => {
      log.error(`Failed to create the new user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Logs in an existing user.
   * NOTE If `options._provider`, this method should trigger a BL script.
   *
   * @param   {Object|string} usernameOrData      Username, or user data.
   * @param   {string}        [password]          Password.
   * @param   {Options}       [options]           Options.
   * @param   {boolean}       [options._provider] Login via Business Logic. May only
   *                                              be used internally to provide social
   *                                              login for browsers.
   * @returns {Promise}                           The active user.
  */
  static login(usernameOrData, password, options = {}) {
    let kinvey = Kinvey.instance();

    // Reject if a user is already active
    if (isDefined(User.getActive())) {
      return Promise.reject(new Error('Already logged in.'));
    }

    // Cast arguments
    if (isObject(usernameOrData)) {
      options = isDefined(options) ? options : password;
    } else {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    // Default options
    options = options || {};

    // Validate username and password
    if ((!isDefined(usernameOrData.username) || !isDefined(usernameOrData.password)) && !isDefined(usernameOrData._socialIdentity)) {
      return Promise.reject(new Error('Username and/or password missing. Please provide both a username and password to login.'));
    }

    // Debug
    log.info(`Login in a user.`);

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${kinvey.appKey}/login`, null, usernameOrData);

    // Set the data policy
    request.dataPolicy = DataPolicy.CloudFirst;

    // Set the auth type
    request.auth = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the active
      User.setActive(user);

      // Return the user
      return user.toJSON();
    });

    // Debug
    promise.then((response) => {
      log.info(`Logged in user ${response.data._id}.`);
    }).catch(() => {
      log.error(`Failed to login the user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Logs in an existing user through a provider.
   *
   * @param   {String}  provider  Provider.
   * @param   {Object}  tokens    Tokens.
   * @param   {Object}  [options] Options.
   * @returns {Promise}           The active user.
   */
  static loginWithProvider(provider, tokens, options) {
    // Debug.
    // if(KINVEY_DEBUG) {
    //   log('Logging in with a provider.', arguments);
    // }

    // Parse tokens.
    let data = {_socialIdentity: {}};
    data._socialIdentity[provider] = tokens;

    // Forward to `User.login()`.
    return User.login(data, options);
  }

  /**
   * Requests email verification for a user.
   *
   * @param   {String}  username  Username.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  static verifyEmail(username, options = {}) {
    let kinvey = Kinvey.instance();

    // Debug
    log.info('Requesting email verification.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${kinvey.appKey}/${username}/user-email-verification-initiate`);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then(() => {
      log.info(`Requested email verification.`);
    }).catch(() => {
      log.error(`Failed to request email verification.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Requests a username reminder for a user.
   *
   * @param   {String}  email     Email.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  static forgotUsername(email, options = {}) {
    let kinvey = Kinvey.instance();

    // Debug
    log.info('Requesting a username reminder.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${kinvey.appKey}/user-forgot-username`, null, {email: email});

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then(() => {
      log.info(`Requested a username reminder.`);
    }).catch(() => {
      log.error(`Failed to request a username reminder.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Requests a password reset for a user.
   *
   * @param   {String}  username  Username.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  static resetPassword() {
    // Forward to `user.resetPassword()`.
    let user = User.getActive();
    return user.resetPassword();
  }

  /**
   * Checks whether a username exists.
   *
   * @param   {String}  username  Username to check.
   * @param   {Options} [options] Options.
   * @returns {Promise}           `true` if username exists, `false` otherwise.
   */
  static exists(username, options = {}) {
    let kinvey = Kinvey.instance();

    // Debug
    log.info('Checking whether a username exists.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${kinvey.appKey}/check-username-exists`, null, {username: username});

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then(() => {
      log.info(`Checked whether the username exists.`);
    }).catch(() => {
      log.error(`Failed to check whather the username exists.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Current user that is logged in.
   *
   * @return {User} The current user.
   */
  static getActive() {
    let user = User[activeUserSymbol];
    let cache = CacheManager.instance();

    // Check cache
    if (!isDefined(user)) {
      let cachedUser = cache.get(activeUserKey);

      if (isDefined(cachedUser)) {
        user = new User(cachedUser);
        User[activeUserSymbol] = user;
      }
    }

    return user;
  }

  static setActive(user) {
    let activeUser = User.getActive();
    let cache = CacheManager.instance();

    // Remove the current user
    if (isDefined(activeUser)) {
      // Remove the current user from cache
      cache.del(activeUserKey);

      // Set the current user to null
      User[activeUserSymbol] = null;

      // Debug
      log.info(`Removed the active user with _id ${activeUser._id}.`);
    }

    // Create a new user
    if (isDefined(user)) {
      if (!(user instanceof User)) {
        // Call toJSON if it is available
        if (isFunction(user.toJSON)) {
          user = user.toJSON();
        }

        // Create the user
        activeUser = new User(user);
      }
      else {
        activeUser = user;
      }

      // Store in cache
      cache.set(activeUserKey, activeUser.toJSON());

      // Set the current user
      User[activeUserSymbol] = activeUser;

      // Debug
      log.info(`Set active user with _id ${activeUser._id}`);
    }
  }
}

export default User;

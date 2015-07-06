import HttpMethod from '../enums/httpMethod';
import Entity from './entity';
import utils from './utils';
import Request from './request';
import AuthType from '../enums/authType';
import Cache from './cache';
import log from './logger';
import Kinvey from '../kinvey';
const currentUserSymbol = Symbol();
const currentUserKey = 'CurrentUser';

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
    let currentUser = User.current;
    return this.data._id === currentUser.data._id;
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

    // Set the current user to null
    User.current = null;

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
    let user = User.current;

    if (utils.isDefined(user)) {
      // Forward to `user.logout()`.
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
    request.authType = AuthType.Session;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // The response.data is a fresh copy of the active user. However, the response
      // does not contain `_kmd.authtoken`. Therefore, extract it from the
      // stale copy.
      response.data._kmd.authtoken = this.data._kmd.authtoken;

      // Set the data for the user
      this.data = response.data;

      // Set the user as the current
      kinvey.activeUser = this;

      // Return the user
      return this;
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
    let user = User.current;
    return user.me(options);
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
    request.authType = AuthType.App;

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
    if (options.state !== false && utils.isDefined(User.current)) {
      let error = new Error('Already logged in.');
      return Promise.reject(error);
    }

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${kinvey.appKey}`, null, data);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the current
      if (options.state !== false) {
        kinvey.activeUser = user;
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
    if (utils.isDefined(User.current)) {
      return Promise.reject(new Error('Already logged in.'));
    }

    // Cast arguments
    if (utils.isObject(usernameOrData)) {
      options = utils.isDefined(options) ? options : password;
    } else {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    // Default options
    options = options || {};

    // Validate username and password
    if ((!utils.isDefined(usernameOrData.username) || !utils.isDefined(usernameOrData.password)) && !utils.isDefined(usernameOrData._socialIdentity)) {
      return Promise.reject(new Error('Username and/or password missing. Please provide both a username and password to login.'));
    }

    // Debug
    log.info(`Login in a user.`);

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${kinvey.appKey}/login`, null, usernameOrData);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the current
      kinvey.activeUser = user;

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
    let user = User.current;
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
  static get current() {
    let user = this[currentUserSymbol];

    // Check cache
    if (!utils.isDefined(user)) {
      let cache = Cache.get(currentUserKey);

      if (utils.isDefined(cache)) {
        user = new User(cache);
        this[currentUserSymbol] = user;
      }
    }

    return user;
  }

  static set current(user) {
    let currentUser = this[currentUserSymbol];

    // Remove the current user
    if (utils.isDefined(currentUser)) {
      // Remove the current user from cache
      Cache.del(currentUserKey);

      // Set the current user to null
      this[currentUserSymbol] = null;

      // Debug
      log.info(`Removed the current user with _id ${currentUser._id}.`);
    }

    // Create a new user
    if (utils.isDefined(user)) {
      if (!(user instanceof User)) {
        // Call toJSON if it is available
        if (typeof user.toJSON === typeof Function) {
          user = user.toJSON();
        }

        // Create the user
        currentUser = new User(user);
      } else {
        currentUser = user;
      }

      // Store in cache
      Cache.set(currentUserKey, currentUser.toJSON());

      // Set the current user
      this[currentUserSymbol] = currentUser;

      // Debug
      log.info(`Set current user with _id ${currentUser._id}`);
    }
  }
}

export default User;

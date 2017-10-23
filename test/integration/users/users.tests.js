runner.run(testFunc);

function testFunc() {

  const assertUserData = (user, expectedUsername) => {
    expect(user.data._id).to.exist;
    expect(user._kmd.authtoken).to.exist;
    expect(user._kmd.lmt).to.exist;
    expect(user._kmd.ect).to.exist;
    expect(user._acl.creator).to.exist;
    if (expectedUsername) {
      expect(user.data.username).to.equal(expectedUsername);
    } else {
      expect(user.data.username).to.exist;
    }
    expect(user.data.password).to.equal(undefined);
    expect(user.isActive()).to.equal(true);
    expect(user).to.deep.equal(Kinvey.User.getActiveUser());
  }

  const deleteUsers = (userIds, done) => {
    async.eachLimit(userIds, 5, (userId, callback) => {
      return Kinvey.User.remove(userId, {
          hard: true
        })
        .then(callback).catch(callback)
    }, () => {
      done();
    });
  }

  describe('User tests', function() {

    const collectionName = externalConfig.collectionName;
    const missingCredentialsError = 'Username and/or password missing';
    const createdUserIds = [];

    before((done) => {
      Kinvey.initialize({
        appKey: externalConfig.appKey,
        appSecret: externalConfig.appSecret
      });
      done();
    });

    after((done) => {
      deleteUsers(createdUserIds, done)
    });

    describe('login()', function() {

      beforeEach(function(done) {
        return Kinvey.User.logout()
          .then(() => {
            done();
          })
      });

      it('should throw an error if an active user already exists', function(done) {
        return Kinvey.User.signup({
            username: randomString(),
            password: randomString()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.login(randomString(), randomString());
          })
          .catch((error) => {
            expect(error.message).to.contain('An active user already exists.');
            done();
          }).catch(done);
      });

      it('should throw an error if a username is not provided', function(done) {
        return Kinvey.User.login(null, randomString())
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if the username is an empty string', function(done) {
        return Kinvey.User.login(' ', randomString())
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if a password is not provided', function(done) {
        return Kinvey.User.login(randomString())
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if the password is an empty string', function(done) {
        return Kinvey.User.login(randomString(), ' ')
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if the username and/or password is invalid', function(done) {
        const user = new Kinvey.User();
        return user.login(randomString(), randomString())
          .catch((error) => {
            expect(error.message).to.contain('Invalid credentials. Please retry your request with correct credentials');
            done();
          }).catch(done);
      });

      it('should login a user', function(done) {
        const username = randomString();
        const password = randomString();
        return Kinvey.User.signup({
            username: username,
            password: password
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.logout()
          })
          .then(() => {
            return Kinvey.User.login(username, password)
          })
          .then((user) => {
            assertUserData(user, username);
            done();
          }).catch(done);
      });

      it('should login a user by providing credentials as an object', function(done) {
        const username = randomString();
        const password = randomString();
        return Kinvey.User.signup({
            username: username,
            password: password
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.logout()
          })
          .then(() => {
            return Kinvey.User.login({
              username: username,
              password: password
            })
          })
          .then((user) => {
            assertUserData(user, username);
            done();
          }).catch(done);
      });
    });

    describe('logout()', function() {
      let cacheDataStore;
      const networkDataStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
      const username = randomString();
      const password = randomString();

      before((done) => {

        cacheDataStore = Kinvey.DataStore.collection(collectionName);
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: username,
              password: password
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return cacheDataStore.save({
              field: 'value'
            })
          })
          .then(() => {
            return cacheDataStore.pull()
          })
          .then((entities) => {
            expect(entities.length).to.be.greaterThan(0);
            done();
          }).catch(done);
      });

      afterEach((done) => {
        return Kinvey.User.logout()
          .then(() => {
            done();
          })
      });

      after((done) => {
        return Kinvey.User.login({
            username: username,
            password: password
          })
          .then(() => {
            const query = new Kinvey.Query();
            query.equalTo('field', 'value');
            return networkDataStore.remove(query)
          })
          .then(() => {
            done();
          }).catch(done);
      });

      it('should logout the active user', function(done) {
        expect(Kinvey.User.getActiveUser()).to.not.equal(null);
        return Kinvey.User.logout()
          .then((user) => {
            expect(user.isActive()).to.equal(false);
            expect(Kinvey.User.getActiveUser()).to.equal(null);
            return Kinvey.User.signup()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            const dataStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
            return dataStore.find().toPromise()
          })
          .then((entities) => {
            expect(entities).to.deep.equal([]);
            done();
          }).catch(done);
      });

      it('should logout when there is not an active user', (done) => {
        return Kinvey.User.logout()
          .then(() => {
            expect(Kinvey.User.getActiveUser()).to.equal(null);
            return Kinvey.User.logout()
          })
          .then(() => {
            expect(Kinvey.User.getActiveUser()).to.equal(null);
            done();
          }).catch(done);
      });
    });

    describe('signup', function() {
      beforeEach(function(done) {
        return Kinvey.User.logout()
          .then(() => {
            done();
          })
      });

      it('should signup and set the user as the active user', function(done) {
        const user = new Kinvey.User();
        const username = randomString();
        return user.signup({
            username: username,
            password: randomString()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, username);
            done();
          }).catch(done);
      });

      it('should signup with a user and set the user as the active user', function(done) {
        const username = randomString();
        const user = new Kinvey.User({
          username: username,
          password: randomString()
        });
        return Kinvey.User.signup(user)
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, username);
            done();
          }).catch(done);
      });

      it('should signup with attributes and store them correctly', function(done) {
        const data = {
          username: randomString(),
          password: randomString(),
          email: 'testEmail@test.com',
          additionalField: 'test'
        }
        return Kinvey.User.signup(data)
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, data.username);
            expect(user.data.email).to.equal(data.email);
            expect(user.data.additionalField).to.equal(data.additionalField);
            done();
          }).catch(done);
      });

      it('should signup user and not set the user as the active user', function(done) {
        return Kinvey.User.signup({
            username: randomString(),
            password: randomString()
          }, {
            state: false
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            expect(user.isActive()).to.equal(false);
            expect(user).to.not.deep.equal(Kinvey.User.getActiveUser());
            done();
          }).catch(done);
      });

      it('should signup an implicit user and set the user as the active user', function(done) {
        return Kinvey.User.signup()
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user)
            done();
          }).catch(done);
      });

      it('should merge the signup data and set the user as the active user', function(done) {
        const user = new Kinvey.User({
          username: randomString(),
          password: randomString()
        });
        const username = randomString();
        return user.signup({
            username: username
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            expect(user.isActive()).to.equal(true);
            expect(user.username).to.equal(username);
            expect(user).to.deep.equal(Kinvey.User.getActiveUser());
            done();
          }).catch(done);
      });

      it('should throw an error if an active user already exists', function(done) {
        return Kinvey.User.signup({
            username: randomString(),
            password: randomString()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.signup({
              username: randomString(),
              password: randomString()
            });
          })
          .catch((error) => {
            expect(error.message).to.contain('An active user already exists.');
            done();
          }).catch(done);
      });

      it('should not throw an error with an active user and options.state set to false', function(done) {
        return Kinvey.User.signup({
            username: randomString(),
            password: randomString()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.signup({
              username: randomString(),
              password: randomString()
            }, {
              state: false
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            expect(user.isActive()).to.equal(false);
            expect(user).to.not.equal(Kinvey.User.getActiveUser());
            done();
          }).catch(done);
      });
    });

    describe('update()', function() {

      before((done) => {
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            done();
          }).catch(done);
      });

      it('should update the active user', (done) => {
        const email = randomString();
        return Kinvey.User.update({
            email: email
          })
          .then(() => {
            const activeUser = Kinvey.User.getActiveUser();
            expect(activeUser.data.email).to.equal(email);
            const query = new Kinvey.Query();
            query.equalTo('email', email);
            return Kinvey.User.lookup(query).toPromise()
          })
          .then((users) => {
            expect(users.length).to.equal(1);
            done();
          }).catch(done);
      });

      it('should throw an error if the user does not have an _id', (done) => {
        const user = new Kinvey.User();

        return user.update({
            email: randomString()
          })
          .catch((error) => {
            expect(error.message).to.equal('User must have an _id.');
            done();
          }).catch(done);
      });
    });

    describe('lookup()', function() {
      const firstName = randomString();

      before((done) => {
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: randomString(),
              first_name: firstName,
              password: randomString()
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.signup({
              username: randomString(),
              first_name: firstName,
              password: randomString()
            }, {
              state: false
            })
          }).then((user) => {
            createdUserIds.push(user.data._id);
            done();
          })
      });

      it('should throw an error if the query argument is not an instance of the Query class', (done) => {
        return Kinvey.User.lookup({})
          .toPromise()
          .catch((error) => {
            expect(error.message).to.equal('Invalid query. It must be an instance of the Query class.');
            done();
          }).catch(done);
      });

      it('should return an array of users matching the query', (done) => {
        const query = new Kinvey.Query();
        query.equalTo('first_name', firstName);
        return Kinvey.User.lookup(query)
          .toPromise()
          .then((users) => {
            expect(users).to.be.an('array');
            expect(users.length).to.equal(2);
            users.forEach((user) => {
              expect(user._id).to.exist;
              expect(user.first_name).to.equal(firstName);
              expect(user.username).to.exist;
            })
            done();
          }).catch(done);
      });
    });

    describe('remove()', function() {
      let userToRemoveId;
      let username;

      beforeEach((done) => {
        username = randomString();
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: username,
              password: randomString()
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            userToRemoveId = user._id;
            done();
          }).catch(done);
      });

      it('should throw a KinveyError if an id is not provided', (done) => {
        return Kinvey.User.remove()
          .catch((error) => {
            expect(error.message).to.equal('An id was not provided.');
            done();
          }).catch(done);
      });

      it('should throw a KinveyError if an id is not a string', (done) => {
        return Kinvey.User.remove(1)
          .catch((error) => {
            expect(error.message).to.equal('The id provided is not a string.');
            done();
          }).catch(done);
      });

      it('should remove the user that matches the id argument, but the user should remain in the Backend', (done) => {
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: randomString(),
              password: randomString()
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.remove(userToRemoveId)
          })
          .then(() => {
            return Kinvey.User.exists(username)
          })
          .then((result) => {
            expect(result).to.be.true
            const query = new Kinvey.Query();
            query.equalTo('username', username);
            return Kinvey.User.lookup(query).toPromise()
          })
          .then((users) => {
            expect(users.length).to.equal(0);
            done();
          }).catch(done);
      });

      it('should remove the user that matches the id argument permanently', (done) => {
        return Kinvey.User.remove(userToRemoveId, {
            hard: true
          })
          .then(() => {
            return Kinvey.User.exists(username)
          })
          .then((result) => {
            expect(result).to.be.false
            done();
          }).catch(done);
      });
    });

    describe('exists()', function() {
      let username;

      before((done) => {
        username = randomString();
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: username,
              password: randomString()
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            done();
          })
      });

      it('should return true if the user exists in the Backend', (done) => {
        return Kinvey.User.exists(username)
          .then((result) => {
            expect(result).to.be.true
            done();
          }).catch(done);
      });

      it('should return false if the user does not exist in the Backend', (done) => {
        return Kinvey.User.exists('not_existing_username')
          .then((result) => {
            expect(result).to.be.false
            done();
          }).catch(done);
      });
    });
  });
}
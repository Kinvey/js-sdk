runner.run(testFunc);

function testFunc() {

  const assertUserData = (user, expectedUsername, shouldReturnPassword) => {
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
    if (shouldReturnPassword) {
      expect(user.data.password).to.exist;
    }
    expect(user.isActive()).to.equal(true);
    expect(user).to.deep.equal(Kinvey.User.getActiveUser());
  }

  describe('User tests', () => {

    const collectionName = externalConfig.collectionName;
    const missingCredentialsError = 'Username and/or password missing';
    const createdUserIds = [];

    before((done) => {
      Kinvey.init({
        appKey: externalConfig.appKey,
        appSecret: externalConfig.appSecret
      });
      done();
    });

    after((done) => {
      common.deleteUsers(createdUserIds)
        .then(() => done())
        .catch(done)
    });

    describe('login()', () => {

      beforeEach((done) => {
        return Kinvey.User.logout()
          .then(() => {
            done();
          })
      });

      it('should throw an error if an active user already exists', (done) => {
        return Kinvey.User.signup({
          username: common.randomString(),
          password: common.randomString()
        })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.login(common.randomString(), common.randomString());
          })
          .catch((error) => {
            expect(error.message).to.contain('An active user already exists.');
            done();
          }).catch(done);
      });

      it('should throw an error if a username is not provided', (done) => {
        return Kinvey.User.login(null, common.randomString())
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if the username is an empty string', (done) => {
        return Kinvey.User.login(' ', common.randomString())
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if a password is not provided', (done) => {
        return Kinvey.User.login(common.randomString())
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if the password is an empty string', (done) => {
        return Kinvey.User.login(common.randomString(), ' ')
          .catch((error) => {
            expect(error.message).to.contain(missingCredentialsError);
            done();
          }).catch(done);
      });

      it('should throw an error if the username and/or password is invalid', (done) => {
        const user = new Kinvey.User();
        return user.login(common.randomString(), common.randomString())
          .catch((error) => {
            expect(error.message).to.contain('Invalid credentials. Please retry your request with correct credentials');
            done();
          }).catch(done);
      });

      it('should login a user', (done) => {
        const username = common.randomString();
        const password = common.randomString();
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

      it('should login a user by providing credentials as an object', (done) => {
        const username = common.randomString();
        const password = common.randomString();
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

    describe('logout()', () => {
      let syncDataStore;
      const username = common.randomString();
      const password = common.randomString();

      before((done) => {
        syncDataStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
        Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: username,
              password: password
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return syncDataStore.save({
              field: 'value'
            })
          })
          .then(() => done())
          .catch(done);
      });

      it('should logout the active user', (done) => {
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
        Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.logout()
          })
          .then(() => {
            expect(Kinvey.User.getActiveUser()).to.equal(null);
          })
          .then(() => done())
          .catch(done);
      });
    });

    describe('signup', () => {
      beforeEach((done) => {
        return Kinvey.User.logout()
          .then(() => {
            done();
          })
      });

      it('should signup and set the user as the active user', (done) => {
        const user = new Kinvey.User();
        const username = common.randomString();
        return user.signup({
          username: username,
          password: common.randomString()
        })
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, username, true);
            done();
          }).catch(done);
      });

      it('should signup with a user and set the user as the active user', (done) => {
        const username = common.randomString();
        const user = new Kinvey.User({
          username: username,
          password: common.randomString()
        });
        return Kinvey.User.signup(user)
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, username, true);
            done();
          }).catch(done);
      });

      it('should signup with attributes and store them correctly', (done) => {
        const data = {
          username: common.randomString(),
          password: common.randomString(),
          email: 'testEmail@test.com',
          additionalField: 'test'
        }
        return Kinvey.User.signup(data)
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, data.username, true);
            expect(user.data.email).to.equal(data.email);
            expect(user.data.additionalField).to.equal(data.additionalField);
            done();
          }).catch(done);
      });

      it('should signup user and not set the user as the active user', (done) => {
        return Kinvey.User.signup({
          username: common.randomString(),
          password: common.randomString()
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

      it('should signup an implicit user and set the user as the active user', (done) => {
        return Kinvey.User.signup()
          .then((user) => {
            createdUserIds.push(user.data._id);
            assertUserData(user, null, true)
            done();
          }).catch(done);
      });

      it('should merge the signup data and set the user as the active user', (done) => {
        const user = new Kinvey.User({
          username: common.randomString(),
          password: common.randomString()
        });
        const username = common.randomString();
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

      it('should throw an error if an active user already exists', (done) => {
        return Kinvey.User.signup({
          username: common.randomString(),
          password: common.randomString()
        })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.signup({
              username: common.randomString(),
              password: common.randomString()
            });
          })
          .catch((error) => {
            expect(error.message).to.contain('An active user already exists.');
            done();
          }).catch(done);
      });

      it('should not throw an error with an active user and options.state set to false', (done) => {
        return Kinvey.User.signup({
          username: common.randomString(),
          password: common.randomString()
        })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.signup({
              username: common.randomString(),
              password: common.randomString()
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

    describe('update()', () => {

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
        const email = common.randomString();
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
          email: common.randomString()
        })
          .catch((error) => {
            expect(error.message).to.equal('User must have an _id.');
            done();
          }).catch(done);
      });
    });

    describe('lookup()', () => {
      const firstName = common.randomString();

      before((done) => {
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: common.randomString(),
              first_name: firstName,
              password: common.randomString()
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.signup({
              username: common.randomString(),
              first_name: firstName,
              password: common.randomString()
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

    describe('remove()', () => {
      let userToRemoveId1;
      let userToRemoveId2;
      let username1 = common.randomString();
      let username2 = common.randomString();

      before((done) => {
        username = common.randomString();
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: username1,
              password: common.randomString()
            })
          })
          .then((user) => {
            userToRemoveId1 = user.data._id;
            createdUserIds.push(userToRemoveId1);
          })
          .then(() => {
            return Kinvey.User.signup({
              username: username2,
              password: common.randomString()
            }, {
                state: false
              })
              .then((user) => {
                userToRemoveId2 = user.data._id;
                done();
              })
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
              username: common.randomString(),
              password: common.randomString()
            })
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return Kinvey.User.remove(userToRemoveId1)
          })
          .then(() => {
            return Kinvey.User.exists(username1)
          })
          .then((result) => {
            expect(result).to.be.true
            const query = new Kinvey.Query();
            query.equalTo('username', username1);
            return Kinvey.User.lookup(query).toPromise()
          })
          .then((users) => {
            expect(users.length).to.equal(0);
            done();
          }).catch(done);
      });

      it('should remove the user that matches the id argument permanently', (done) => {
        return Kinvey.User.remove(userToRemoveId2, {
          hard: true
        })
          .then(() => {
            return Kinvey.User.exists(username2)
          })
          .then((result) => {
            expect(result).to.be.false
            done();
          }).catch(done);
      });
    });

    describe('exists()', () => {
      let username;

      before((done) => {
        username = common.randomString();
        return Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup({
              username: username,
              password: common.randomString()
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
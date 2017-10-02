testRunner.run(testFunc);

function testFunc() {

    const collectionName = 'Books';
    const missingCredentialsError = 'Username and/or password missing';

    const uid = (size = 10) => {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < size; i += 1) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    const randomString = (size = 18, prefix = '') => {
        return `${prefix}${uid(size)}`;
    }

    const assertUserData = (user, expectedUsername) => {
        expect(user.data._id).to.exist;
        expect(user._kmd.authtoken).to.exist;
        expect(user._kmd.lmt).to.exist;
        expect(user._kmd.ect).to.exist;
        expect(user._acl.creator).to.exist;
        expect(user.data.username).to.equal(expectedUsername);
        expect(user.data.password).to.equal(undefined);
        expect(user.isActive()).to.equal(true);
        expect(user).to.deep.equal(Kinvey.User.getActiveUser());
    }


    describe('User tests', function() {

        before((done) => {
            Kinvey.initialize({
                appKey: 'kid_H1fs4gFsZ',
                appSecret: 'aa42a6d47d0049129c985bfb37821877'
            });
            done();
        });

        describe('login()', function() {

            beforeEach(function(done) {
                Kinvey.User.logout()
                    .then(() => {
                        done();
                    })
            });

            afterEach(function(done) {
                Kinvey.User.logout()
                    .then(() => {
                        done();
                    })
            });

            it('should throw an error if an active user already exists', function(done) {
                Kinvey.User.signup(randomString(), randomString())
                    .then(() => {
                        return Kinvey.User.login(randomString(), randomString());
                    })
                    .catch((error) => {
                        expect(error.message).to.contain('An active user already exists.');
                        done();
                    }).catch(done);
            });

            it('should throw an error if a username is not provided', function(done) {
                Kinvey.User.login(null, randomString())
                    .catch((error) => {
                        expect(error.message).to.contain(missingCredentialsError);
                        done();
                    }).catch(done);
            });

            it('should throw an error if the username is an empty string', function(done) {
                Kinvey.User.login(' ', randomString())
                    .catch((error) => {
                        expect(error.message).to.contain(missingCredentialsError);
                        done();
                    }).catch(done);
            });

            it('should throw an error if a password is not provided', function(done) {
                Kinvey.User.login(randomString())
                    .catch((error) => {
                        expect(error.message).to.contain(missingCredentialsError);
                        done();
                    }).catch(done);
            });

            it('should throw an error if the password is an empty string', function(done) {
                Kinvey.User.login(randomString(), ' ')
                    .catch((error) => {
                        expect(error.message).to.contain(missingCredentialsError);
                        done();
                    }).catch(done);
            });

            it('should throw an error if the username and/or password is invalid', function(done) {
                const user = new Kinvey.User();
                user.login(randomString(), randomString())
                    .catch((error) => {
                        expect(error.message).to.contain('Invalid credentials. Please retry your request with correct credentials');
                        done();
                    }).catch(done);
            });

            it('should login a user', function(done) {
                const username = randomString();
                const password = randomString();
                Kinvey.User.signup({
                        username: username,
                        password: password
                    })
                    .then(() => {
                        Kinvey.User.logout()
                            .then(() => {
                                Kinvey.User.login(username, password)
                                    .then((user) => {
                                        assertUserData(user, username);
                                        done();
                                    }).catch(done);
                            }).catch(done);
                    }).catch(done);
            });

            it('should login a user by providing credentials as an object', function(done) {
                const username = randomString();
                const password = randomString();
                Kinvey.User.signup({
                        username: username,
                        password: password
                    })
                    .then(() => {
                        Kinvey.User.logout()
                            .then(() => {
                                Kinvey.User.login({
                                        username: username,
                                        password: password
                                    })
                                    .then((user) => {
                                        assertUserData(user, username);
                                        done();
                                    }).catch(done);
                            }).catch(done);
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
                Kinvey.User.signup({
                        username: username,
                        password: password
                    })
                    .then(() => {
                        cacheDataStore.save({
                                field: 'value'
                            })
                            .then(() => {
                                cacheDataStore.pull()
                                    .then((entities) => {
                                        expect(entities.length).to.be.greaterThan(0);
                                        done();
                                    }).catch(done);
                            }).catch(done);
                    }).catch(done);
            });

            afterEach((done) => {
                Kinvey.User.logout()
                    .then(() => {
                        done();
                    })
            });

            after((done) => {
                Kinvey.User.login({
                        username: username,
                        password: password
                    })
                    .then(() => {
                        const query = new Kinvey.Query();
                        query.equalTo('field', 'value');
                        networkDataStore.remove(query)
                            .then(() => {
                                done();
                            }).catch(done);
                    }).catch(done);
            });

            it('should logout the active user', function(done) {
                expect(Kinvey.User.getActiveUser()).to.not.equal(null);
                Kinvey.User.logout()
                    .then(() => {
                        expect(Kinvey.User.getActiveUser()).to.equal(null);
                        Kinvey.User.signup()
                            .then(() => {
                                const dataStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
                                dataStore.find().toPromise()
                                    .then((entities) => {
                                        expect(entities).to.deep.equal([]);
                                        done();
                                    }).catch(done);
                            }).catch(done);
                    }).catch(done);
            });

            it('should logout when there is not an active user', (done) => {
                Kinvey.User.logout()
                    .then(() => {
                        expect(Kinvey.User.getActiveUser()).to.equal(null);
                        Kinvey.User.logout()
                            .then(() => {
                                expect(Kinvey.User.getActiveUser()).to.equal(null);
                                done();
                            }).catch(done);
                    }).catch(done);
            });
        });

        describe('signup', function() {
            beforeEach(function(done) {
                Kinvey.User.logout()
                    .then(() => {
                        done();
                    })
            });

            it('should signup and set the user as the active user', function(done) {
                const user = new Kinvey.User();
                const username = randomString();
                user.signup({
                        username: username,
                        password: randomString()
                    })
                    .then((user) => {
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
                Kinvey.User.signup(user)
                    .then((user) => {
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
                Kinvey.User.signup(data)
                    .then((user) => {
                        assertUserData(user, data.username);
                        expect(user.data.email).to.equal(data.email);
                        expect(user.data.additionalField).to.equal(data.additionalField);
                        done();
                    }).catch(done);
            });

            it('should signup user and not set the user as the active user', function(done) {
                Kinvey.User.signup({
                        username: randomString(),
                        password: randomString()
                    }, {
                        state: false
                    })
                    .then((user) => {
                        expect(user.isActive()).to.equal(false);
                        expect(user).to.not.deep.equal(Kinvey.User.getActiveUser());
                        done();
                    }).catch(done);
            });

            it('should signup an implicit user and set the user as the active user', function(done) {
                Kinvey.User.signup()
                    .then((user) => {
                        expect(user.isActive()).to.equal(true);
                        expect(user).to.deep.equal(Kinvey.User.getActiveUser());
                        done();
                    }).catch(done);
            });

            it('should merge the signup data and set the user as the active user', function(done) {
                const user = new Kinvey.User({
                    username: randomString(),
                    password: randomString()
                });
                const username = randomString();
                user.signup({
                        username: username
                    })
                    .then((user) => {
                        expect(user.isActive()).to.equal(true);
                        expect(user.username).to.equal(username);
                        expect(user).to.deep.equal(Kinvey.User.getActiveUser());
                        done();
                    }).catch(done);
            });

            it('should throw an error if an active user already exists', function(done) {
                Kinvey.User.signup({
                        username: randomString(),
                        password: randomString()
                    })
                    .then(() => {
                        Kinvey.User.signup({
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
                Kinvey.User.signup({
                        username: randomString(),
                        password: randomString()
                    })
                    .then(() => {
                        Kinvey.User.signup({
                                username: randomString(),
                                password: randomString()
                            }, {
                                state: false
                            })
                            .then((user) => {
                                expect(user.isActive()).to.equal(false);
                                expect(user).to.not.equal(Kinvey.User.getActiveUser());
                                done();
                            }).catch(done);
                    })
            });
        });
    });
}
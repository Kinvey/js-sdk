testRunner.run(testFunc);

function testFunc() {

    function uid(size = 10) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < size; i += 1) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    function randomString(size = 18, prefix = '') {
        return `${prefix}${uid(size)}`;
    }

    before((done) => {
        Kinvey.initialize({
            appKey: 'kid_H1fs4gFsZ',
            appSecret: 'aa42a6d47d0049129c985bfb37821877'
        });
        done();
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
            user.signup({
                    username: randomString(),
                    password: randomString()
                })
                .then((user) => {
                    expect(user.isActive()).to.equal(true);
                    expect(user).to.deep.equal(Kinvey.User.getActiveUser());
                    done();
                }).catch(done);
        });

        it('should signup with a user and set the user as the active user', function(done) {
            const user = new Kinvey.User({
                username: randomString(),
                password: randomString()
            });
            Kinvey.User.signup(user)
                .then((user) => {
                    expect(user.isActive()).to.equal(true);
                    expect(user).to.deep.equal(Kinvey.User.getActiveUser());
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
            return user.signup({
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
            Kinvey.User.signup(randomString(), randomString())
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
            Kinvey.User.signup(randomString(), randomString())
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
}
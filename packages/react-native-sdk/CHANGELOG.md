# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.2](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@6.0.1...kinvey-react-native-sdk@6.0.2) (2022-04-28)

* Update package knvey-js-sdk to fix bug when registering for Live service





## [6.0.1](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@6.0.0...kinvey-react-native-sdk@6.0.1) (2022-04-27)

* Update dependencies to fix known vulnerabilities





## [6.0.0](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@5.1.1...kinvey-react-native-sdk@6.0.0) (2021-08-24)

- User login with MIC, using the in-app browser [#604](https://github.com/Kinvey/js-sdk/pull/604)
- Secure session store implementation for user credentials [#615](https://github.com/Kinvey/js-sdk/pull/615)
- Storage performance optimization [#622](https://github.com/Kinvey/js-sdk/pull/622)
- Integration tests setup [#615](https://github.com/Kinvey/js-sdk/pull/615)





## [5.1.2](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@5.1.1...kinvey-react-native-sdk@5.1.2) (2021-05-26)

**Note:** Update package kinvey-js-sdk to fix an issue with sporadic logouts





## [5.1.1](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@5.1.0...kinvey-react-native-sdk@5.1.1) (2021-04-12)

**Note:** Version bump only for package kinvey-js-sdk





## [5.1.0](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@5.0.1...kinvey-react-native-sdk@5.1.0) (2021-04-08)


### Bug Fixes

* Auto DataStore disregards "skip" and "limit" and fetches up to 10000 items per call. [#581](https://github.com/Kinvey/js-sdk/pull/581)





## [5.0.1](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@5.0.0...kinvey-react-native-sdk@5.0.1) (2020-07-22)

- Multi Insert validations [#569](https://github.com/Kinvey/js-sdk/pull/569)





# [5.0.0](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@4.2.5...kinvey-react-native-sdk@5.0.0) (2020-07-10)


### Features

* Introducing the Multi Insert functionality
* Update the default KCS api version to 5 [#566](https://github.com/Kinvey/js-sdk/pull/566)
* Add `lastLoginTime` to Kinvey metadata [#562](https://github.com/Kinvey/js-sdk/pull/562)





# [4.4.0](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@4.3.0...kinvey-react-native-sdk@4.4.0) (2019-09-16)


### Features

* initialize the js sdk core with the PubNub adapter ([3d2d02d](https://github.com/Kinvey/js-sdk/commit/3d2d02d))





# [4.3.0](https://github.com/Kinvey/js-sdk/compare/kinvey-react-native-sdk@4.2.3...kinvey-react-native-sdk@4.3.0) (2019-09-03)


### Bug Fixes

* **react-native-sdk:** remove react-native-sqlite-storage devDependency ([cb411fb](https://github.com/Kinvey/js-sdk/commit/cb411fb))


### Features

* **react-native-sdk:** add sqlite as a storage adapter ([78205d1](https://github.com/Kinvey/js-sdk/commit/78205d1))
* **react-native-sdk:** add support for push notifications ([2a8505f](https://github.com/Kinvey/js-sdk/commit/2a8505f))
* **react-native-sdk:** remove SQLite and replace it with AsyncStorage ([6db798f](https://github.com/Kinvey/js-sdk/commit/6db798f))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.3](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@6.0.2...kinvey-js-sdk@6.0.3) (2022-07-14)


### Bug Fixes

* fixed behaviour when refreshing KCS tokens ([a49b215](https://github.com/Kinvey/js-sdk/commit/a49b2151b0730ac0705f2c7a7ae666181935465b))
* do not save refresh_token returned from _me endpoint ([3201bfa](https://github.com/Kinvey/js-sdk/commit/3201bfae329588f2c59180490defad1a89d7e804))






## [6.0.2](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@6.0.1...kinvey-js-sdk@6.0.2) (2022-04-28)

- Version bump for package kinvey-js-sdk





## [6.0.1](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@6.0.0...kinvey-js-sdk@6.0.1) (2022-04-20)

- Version bump for package kinvey-js-sdk





## [6.0.0](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@5.1.1...kinvey-js-sdk@6.0.0) (2021-07-30)

- Introduce MFA functionality. [#593](https://github.com/Kinvey/js-sdk/pull/593)
- Improve the login process. [#592](https://github.com/Kinvey/js-sdk/pull/592)
- Change the default API version to 6. [#602](https://github.com/Kinvey/js-sdk/pull/602)
- Implement async SessionStore API. [#598](https://github.com/Kinvey/js-sdk/pull/598)
- Do not use the authToken in `me()` method. [#596](https://github.com/Kinvey/js-sdk/pull/596)
- Remove the option to set active user on signup. [#616](https://github.com/Kinvey/js-sdk/pull/616)





## [5.1.2](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@5.1.1...kinvey-js-sdk@5.1.2) (2022-05-26)

### Bug Fixes

* Fixed an issue with sporadic logouts





## [5.1.1](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@5.1.0...kinvey-js-sdk@5.1.1) (2021-04-12)

### Bug Fixes

* The pull function returns an error with Auto store when called with autoPagination: true and there are no items. [#590](https://github.com/Kinvey/js-sdk/pull/590)





## [5.1.0](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@5.0.1...kinvey-js-sdk@5.1.0) (2021-04-08)

### Bug Fixes

* Auto DataStore disregards "skip" and "limit" and fetches up to 10000 items per call. [#581](https://github.com/Kinvey/js-sdk/pull/581)





## [5.0.1](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@5.0.0...kinvey-js-sdk@5.0.1) (2020-07-22)

- Multi Insert validations [#569](https://github.com/Kinvey/js-sdk/pull/569)





# [5.0.0](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@4.2.5...kinvey-js-sdk@5.0.0) (2020-07-10)

### Bug Fixes

* llt using wrong field ([b53a666](https://github.com/Kinvey/js-sdk/commit/b53a666))

### Features

* Introducing the Multi Insert functionality
* Update the default KCS api version to 5 [#566](https://github.com/Kinvey/js-sdk/pull/566)
* Add `lastLoginTime` to Kinvey metadata [#562](https://github.com/Kinvey/js-sdk/pull/562)





## [4.2.5](https://github.com/Kinvey/js-sdk/compare/kinvey-js-sdk@4.2.3...kinvey-js-sdk@4.2.5) (2019-09-03)

**Note:** Version bump only for package kinvey-js-sdk

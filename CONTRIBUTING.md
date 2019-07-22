# Contributing to Kinvey JavaScript SDK

:+1: First of all, thank you for taking the time to contribute! :+1:

Here are some guides on how to do that:

- [Code of Conduct](#coc)
- [Reporting Bugs](#bugs)
- [Requesting New Features](#features)
- [Submitting a PR](#pr)
- [Commit Message Guidelines](#commit-messages)
- [Releasing new versions](#release)

## <a name="coc"></a> Code of Conduct

Help us keep a healthy and open community. We expect all participants in this project to adhere to the [Kinvey Code Of Conduct](https://github.com/Kinvey/codeofconduct).

## <a name="bugs"></a> Reporting Bugs

1. Always update to the most recent master release; the bug may already be resolved.
2. Search for similar issues in the issues list for this repo; it may already be an identified problem.
3. If this is a bug or problem that is clear, simple, and is unlikely to require any discussion -- it is OK to open an issue on GitHub with a reproduction of the bug including workflows and screenshots. If possible, submit a Pull Request with a failing test, entire application or module. If you'd rather take matters into your own hands, fix the bug yourself (jump down to the [Submitting a PR](#pr) section).

> While we are doing all we can to take care of every issue, sometimes we get overwhelmed. That's why
>
> - issues that are not constructive or describe problems that cannot be reproduced will be closed
> - feature requests or bug reports with unanswered questions regarding the behavior/reproduction for more than 20 days will be closed

## <a name="features"></a> Requesting Features

1. Use Github Issues to submit feature requests.
2. First, search for a similar request and extend it if applicable. This way it would be easier for the community to track the features.
3. When requesting a new feature, please provide as much detail as possible about why you need the feature in your apps. We prefer that you explain a need rather than explain a technical solution for it. That might trigger a nice conversation on finding the best and broadest technical solution to a specific need.

## <a name="pr"></a> Submitting a PR

Before you begin:

- Read and sign the [Kinvey Contribution License Agreement](https://goo.gl/forms/spZb2rXhC6I6zOxw1).
- Make sure there is an issue for the bug or feature you will be working on.

Following these steps is the best way to get you code included in the project:

1. Fork and clone the Kinvey JavaScript SDK repo:

```bash
git clone https://github.com/<your-git-username>/js-sdk.git
# Navigate to the newly cloned directory
cd js-sdk
# Add an "upstream" remote pointing to the original Kinvey JavaScript SDK repo.
git remote add upstream https://github.com/Kinvey/js-sdk.git
```

2. Set up the project (for detailed info check our [development workflow guide](DevelopmentWorkflow.md)):

```bash
#In the repo root
npm install
```

3. Create a branch for your PR

```bash
git checkout -b <my-fix-branch> master
```

4. The fun part! Make your code changes. Make sure you:

   - Follow the [code conventions guide](CodingConvention.md).
   - Follow the [guide on handling errors and exceptions](HandlingErrors.md).
   - Write unit tests for your fix or feature. Check out [writing unit tests guide](WritingUnitTests.md).

5. Before you submit your PR:

   - Rebase your changes to the latest master: `git pull --rebase upstream master`.
   - Ensure all unit test are green. Check [running unit tests](DevelopmentWorkflow.md#running-unit-tests).
   - Ensure your changes pass eslint validation. (run `npm run lint` in the root of the repo).

6. Push your fork. If you have rebased you might have to use force-push your branch:

```
git push origin <my-fix-branch> --force
```

7. [Submit your pull request](https://github.com/Kinvey/js-sdk/compare). Please, fill in the Pull Request template - it will help us better understand the PR and increase the chances of it getting merged quickly.

It's our turn from there on! We will review the PR and discuss changes you might have to make before merging it! Thanks!

## <a name="commit-messages"></a> Commit Message Guidelines

Please follow the git commit message format described below when committing your changes or submitting a PR. That allows us to use the commit messages to generate a change log for every new release.

### Commit Message Format

Each commit message consists of a **header**, a **body** and a **footer**. The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

Any line of the commit message cannot be longer 100 characters! This allows the message to be easier
to read on GitHub as well as in various git tools.

Footer should contain a [closing reference to an issue](https://help.github.com/articles/closing-issues-via-commit-messages/) if any.

Samples:

```
docs(README): add link to Kinvey JavaScript SDK roadmap
```

```
fix(cache): update format of sync queue

Add a state to eache sync queue doc that can be used for reverting changes.
```

```
release: 3.2.0 release
```

### Revert

If the commit reverts a previous commit, it should begin with `revert:`, followed by the header of the reverted commit. In the body it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.

### Type

Must be one of the following:

- **build**: Changes that affect the build system or external dependencies (example scopes: npm, grunt)
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Jenkins)
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **fix-next**: A fix for a bug in the master branch, that's not yet released
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **release**: Reference commit for the git tag of the release
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **test**: Adding missing tests or correcting existing tests (example scopes: e2e, name-of-the-test-app)

### Scope

The scope should be the name of the affected component in the code.

### Subject

The subject contains succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize first letter
- no dot (.) at the end

### Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

Sample:

```
feat: Angular 4.2 support

BREAKING CHANGES:

The SDK should be initialized using the KinveyModule.

import { init } from 'kinvey-angular-sdk';

…
init({
  appKey: '<appKey>',
  appSecret: '<appSecret>'
});
…

with:

import { KinveyModule } from 'kinvey-angular-sdk';
…
@NgModule({
  imports: [
    KinveyModule.init({
      appKey: '<appKey>',
      appSecret: '<appSecret>'
    }),
  ]
…
});
```

The above guidelines are based on the [AngularJS Git Commit Message Conventions][commit-message-format]. A detailed explanation and additional examples can be found in this [document][commit-message-format].

## Where to Start

If you want to contribute, but you are not sure where to start - look for [issues labeled `help wanted`](https://github.com/Kinvey/js-sdk/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22).

[commit-message-format]: https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#

## <a name="release"></a> Releasing new versions

Instructions how to release a new version for **Kinvey Core Team Members**.

![](./release-contribution-guide-schema.png?raw=true)

TBD

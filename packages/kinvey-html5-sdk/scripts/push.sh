#!/bin/sh

# This script updates the Kinvey HTML5 SDK Github Repo with the latest release

cd ../dist
git init
git config user.name "Travis CI"
git config user.email "travis@travis-ci.org"
git add .
git commit -m "Travis Build: $TRAVIS_BUILD_NUMBER"
git remote add origin https://${GITHUB_ACCESS_TOKEN}@github.com/Kinvey/html5-sdk.git > /dev/null 2>&1
git tag $TRAVIS_TAG
git push --tags --quiet --set-upstream origin master

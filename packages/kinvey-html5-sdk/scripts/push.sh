#!/bin/sh

# This script updates the Kinvey HTML5 SDK Github Repo with the latest release

dist=../dist
git init $dist
git config user.name "Travis CI"
git config user.email "travis@travis-ci.org"
git -C $dist add .
git -C $dist commit -m "Travis Build: $TRAVIS_BUILD_NUMBER"
git -C $dist remote add origin https://${GITHUB_ACCESS_TOKEN}@github.com/Kinvey/html5-sdk.git > /dev/null 2>&1
git -C $dist tag $TRAVIS_TAG
git -C $dist push --tags --quiet --set-upstream origin master

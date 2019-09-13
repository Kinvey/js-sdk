:warning: **The Kinvey React Native SDK is currently in beta and might contain bugs and/or missing features.** :warning:

# Kinvey React Native SDK

The Kinvey React Native SDK is used to develop an React Native application that connects to Kinvey.

## Install

Using npm install the sdk:

```bash
npm i --save kinvey-react-native-sdk
```

#### Install Async Storage

You will need to install the peer dependency `@react-native-community/async-storage`.

```bash
npm i --save @react-native-community/async-storage
```

After installing `async-storage` make sure you install the cocoapods for iOS.

```bash
cd ios && pod install && cd ..
```

#### **Optional** Install Push Notification

If you would like your application to receive push notifications you will need to install the peer dependency `react-native-push-notification`.

```bash
npm i --save react-native-push-notification
```

##### For iOS

To receive push notifications on iOS you will need to install `@react-native-community/push-notification-ios`.

```bash
npm i --save @react-native-community/push-notification-ios
```

After installing `@react-native-community/push-notification-ios` make sure you install the cocoapods for iOS.

```bash
cd ios && pod install && cd ..
```

Refer to the [this guide](https://github.com/react-native-community/react-native-push-notification-ios#appdelegatem) to update your `AppDelete.m`.

Make sure your project in Xcode has the Push Notifications capability on.

##### For Android

Follow [this guide](https://github.com/zo0r/react-native-push-notification#android-manual-installation) to complete setting up Android.

## Demo App

You can use the [demo app](./demo) as a starting template for your app. You will need to change the `appKey` and `appSecret` in [demo/index.js](./demo/index.js) with your applications credentials.

## Not yet implemented

- User credential storage
- User login with MIC

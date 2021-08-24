# Kinvey React Native SDK

The Kinvey React Native SDK is used to develop an React Native application that connects to Kinvey.

## Install

Using npm install the sdk:

```bash
npm i --save kinvey-react-native-sdk
```

#### Install Peer Dependencies

You will need to install the peer dependencies `@react-native-async-storage/async-storage`, `react-native-keychain` and `react-native-inappbrowser-reborn`

```bash
npm i --save @react-native-async-storage/async-storage
```

```bash
npm i --save react-native-keychain
```

```bash
npm i --save react-native-inappbrowser-reborn
```

After installing them, make sure you install the cocoapods for iOS.

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

Refer to the [this guide](https://github.com/react-native-community/react-native-push-notification-ios#appdelegatem) to update your `AppDelegate.m`.

Make sure your project in Xcode has the Push Notifications capability on.

##### For Android

Follow [this guide](https://github.com/zo0r/react-native-push-notification#android-manual-installation) to complete setting up Android.

/**
 * @format
 */

import {AppRegistry} from 'react-native';
import { init } from 'kinvey-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

// Initialize the Kinvey React Native SDK
init({
  appKey: '<appKey>',
  appSecret: '<appSecret>'
});

AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */

import {AppRegistry} from 'react-native';
import { init } from 'kinvey-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

// Initialize the Kinvey React Native SDK
init({
  appKey: 'kid_rJQ3fa0il',
  appSecret: 'c8368b49fe564ec8a6d172e2ec25e3be'
});

AppRegistry.registerComponent(appName, () => App);

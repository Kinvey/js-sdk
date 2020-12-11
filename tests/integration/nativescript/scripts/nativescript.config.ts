import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.TestApp',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  },
  main: "app.js"
} as NativeScriptConfig;

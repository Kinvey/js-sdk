/**
 * Copyright 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* globals angular: true, Backbone: true, Ember: true, forge: true, jQuery: true */
/* globals ko: true, Titanium: true */

// Device information.
// -------------------

// Build the device information string sent along with every network request.
// <js-library>/<version> [(<library>/<version>,...)] <platform> <version> <manufacturer> <id>
var deviceInformation = function() {
  var browser, model, os, osVersion, platform, platformVersion, deviceType, uuid;
  //var browser, platform, version, manufacturer, id, libraries = [];

  // Helper function to detect the browser name and version.
  var browserDetect = function(ua) {
    // Cast arguments.
    ua = ua.toLowerCase();

    // User-Agent patterns.
    var rChrome  = /(chrome)\/([\w]+)/;
    var rFirefox = /(firefox)\/([\w.]+)/;
    var rIE      = /(msie) ([\w.]+)/i;
    var rOpera   = /(opera)(?:.*version)?[ \/]([\w.]+)/;
    var rSafari  = /(safari)\/([\w.]+)/;

    return rChrome.exec(ua) || rFirefox.exec(ua) || rIE.exec(ua) ||
     rOpera.exec(ua) || rSafari.exec(ua) || [];
  };

  // Platforms.
  if('undefined' !== typeof root.cordova &&
   'undefined' !== typeof root.device) {// PhoneGap
    var device = root.device;
    model = device.model;
    os = device.platform;
    osVersion = device.version;
    platform = 'phonegap';
    platformVersion = device.cordova;
    uuid = device.uuid;
  }
  else if('undefined' !== typeof Titanium) {// Titanium.
    model = Titanium.Platform.getModel();
    os = 'iPhone OS' === Titanium.Platform.getName() ? 'ios' : Titanium.Platform.getName() ;
    osVersion = Titanium.Platform.getVersion();
    platform = 'titanium';
    platformVersion = Titanium.getVersion();
    uuid = Titanium.Platform.getId();
  }
  else if('undefined' !== typeof forge) {// Trigger.io
    //libraries.push('triggerio/' + (forge.config.platform_version || ''));

    if (forge.is.android()){
      os = 'android';
    }
    else if (forge.is.ios()){
      os = 'ios';
    }
    else if (forge.is.web()){
      os = 'mobileweb';
    }
    else {
      os = 'unknown';
    }
    platform = 'triggerio';
    platformVersion = forge.config.platform_version || '';
    uuid = forge.config.uuid;
  }
  else if('undefined' !== typeof process) {// Node.js
    os = 'mobileweb';
    platform = process.title;
    platformVersion = process.version;
    //manufacturer = process.platform;
  }
  // // // Libraries.
  else {
    os = 'mobileweb';
    if('undefined' !== typeof angular) {// AngularJS.
      //libraries.push('angularjs/' + angular.version.full);
      platform = 'angularjs';
      platformVersion = angular.version.full;
    }
    else if('undefined' !== typeof Backbone) {// Backbone.js.
      //libraries.push('backbonejs/' + Backbone.VERSION);
      platform = 'backbonejs';
      platformVersion = Backbone.VERSION;
    }
    else if('undefined' !== typeof Ember) {// Ember.js.
      //libraries.push('emberjs/' + Ember.VERSION);
      platform = 'emberjs';
      platformVersion = Ember.VERSION;

    }
    else if('undefined' !== typeof jQuery) {// jQuery.
      //libraries.push('jquery/' + jQuery.fn.jquery);
      platform = 'jquery';
      platformVersion = jQuery.fn.jquery;
    }
    else if('undefined' !== typeof ko) {// Knockout.
      //libraries.push('knockout/' + ko.version);
      platform = 'knockout';
      platformVersion = ko.version;
    }
    else if('undefined' !== typeof Zepto) {// Zepto.js.
      //libraries.push('zeptojs');
      platform = 'zeptojs';
      platformVersion = '';
    }

  }

  // Default platform, most likely this is just a plain web app.
  if(null == platform && root.navigator) {
    browser = browserDetect(root.navigator.userAgent);
    model = root.navigator.platform;
    os = 'mobileweb';
    platform = browser[1];
    platformVersion = browser[2];
  }

  // Return the device information string.
  var result = {
    'v' : '2',
    'os' : os,
    'osVersion': osVersion,
    'platform' : platform,
    'platformVersion': platformVersion,
    'deviceType': deviceType,
    'uuid' : uuid
  };

  return JSON.stringify(result);
};
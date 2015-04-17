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

// Keep all data in memory.
var dataStorage = {};

// `Storage` adapter for [Node.js](http://nodejs.org/).
var MemoryStorage = {
  /**
   * Filename to store data.
   *
   * @type {String}
   */
  filename: './kinvey-data.txt',

  /**
   * The Node.js fs module.
   *
   * @type {Object}
   */
  fs: require('fs'),

  /**
   * Shared promise to keep asynchronous file operations
   * in order.
   *
   * @type {Promise}
   */
  fsPromise: Kinvey.Defer.resolve(),

  /**
   * @augments {Storage._destroy}
   */
  _destroy: function(key) {
    delete dataStorage[key];

    // Save data storage to file
    MemoryStorage.fsPromise = MemoryStorage.fsPromise.then(function() {
      var deferred = Kinvey.Defer.deferred();

      // Write the file
      var data = JSON.stringify(dataStorage);
      MemoryStorage.fs.writeFile(MemoryStorage.filename, data, function() {
        deferred.resolve(null);
      });

      return deferred.promise;
    });

    return Kinvey.Defer.resolve(null);
  },

  /**
   * @augments {Storage._get}
   */
  _get: function(key) {
    var deferred = Kinvey.Defer.deferred();
    var value = dataStorage[key];

    if (value == null) {
      MemoryStorage.fsPromise = MemoryStorage.fsPromise.then(function() {
        // Read the file
        MemoryStorage.fs.readFile(MemoryStorage.filename, function(err, json) {
          if (err) {
            deferred.resolve(null);
          }
          else {
            try {
              // Parse the JSON
              var data = JSON.parse(json);

              // Get the value
              value = data[key];
              deferred.resolve(value);

              // Save the value to data storage
              dataStorage[key] = value;
            } catch(e) {
              deferred.resolve(null);
            }
          }
        });

        return deferred.promise;
      });
    }
    else {
      deferred.resolve(value);
    }

    return deferred.promise;
  },

  /**
   * @augments {Storage._save}
   */
  _save: function(key, value) {
    // Save the value to data storage
    dataStorage[key] = value;

    // Save data storage to file
    MemoryStorage.fsPromise = MemoryStorage.fsPromise.then(function() {
      var deferred = Kinvey.Defer.deferred();

      // Write the file
      var data = JSON.stringify(dataStorage);
      MemoryStorage.fs.writeFile(MemoryStorage.filename, data, function() {
        deferred.resolve(null);
      });

      return deferred.promise;
    });

    return Kinvey.Defer.resolve(null);
  }
};

// Use memory adapter.
Storage.use(MemoryStorage);

'use strict';

global.Promise = require('bluebird');
Promise.onPossiblyUnhandledRejection(() => {});

module.exports = require('./foobar-vanilla/index');

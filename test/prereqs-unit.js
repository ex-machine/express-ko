'use strict';

let sinon = require('sinon');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let sinonChai = require('sinon-chai');

chai.config.includeStack = true;

chai.use(chaiAsPromised);
chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;

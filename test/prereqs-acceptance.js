'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let supertestChai = require('supertest-chai');

chai.config.includeStack = true;

chai.use(chaiAsPromised);
chai.use(supertestChai.httpAsserts);

global.expect = chai.expect;

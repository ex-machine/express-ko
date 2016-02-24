'use strict';

let app = require('../../examples/foobar');
let co = require('co');
let request = require('supertest-as-promised');

describe('foobar', () => {
	describe('GET /foo/vanillic-bar', () => {
		it('responds with "vanillic bar"', co.wrap(function* () {
			let res = yield request(app)
				.get('/foo/vanillic-bar');

			expect(res).to.be.html;
			expect(res.text).to.equal('vanillic bar');
		}));
	});

	describe('GET /foo/promising-baz', () => {
		it('responds with "promising baz"', co.wrap(function* () {
			let res = yield request(app)
				.get('/foo/promising-baz');

			expect(res).to.be.html;
			expect(res.text).to.equal('promising baz');
		}));
	});

	describe('GET /foo/generous-qux', () => {
		it('responds with ["generous qux"]', co.wrap(function* () {
			let res = yield request(app)
				.get('/foo/generous-qux');

			expect(res).to.be.json;
			expect(res.body).to.deep.equal(['generous qux']);
		}));
	});

	describe('GET /foo/numerous-quux', () => {
		it('responds with 202 (Accepted)', co.wrap(function* () {
			let res = yield request(app)
				.get('/foo/numerous-quux');

			expect(res).to.be.text;
			expect(res).to.have.status(202);
		}));
	});

	describe('GET /paramnesic-thud/thud', () => {
		it('responds with "paramnesic thud"', co.wrap(function* () {
			let res = yield request(app)
				.get('/paramnesic-thud/thud');

			expect(res).to.be.html;
			expect(res.text).to.equal('paramnesic thud');
		}));
	});

	describe('GET /erratic-fred', () => {
		it('responds with 418 (I\'m a teapot) and "erratic fred"', co.wrap(function* () {
			let res = yield request(app)
				.get('/erratic-fred');

			expect(res).to.be.html;
			expect(res.text).to.equal('erratic fred');
			expect(res).to.have.status(418);
		}));
	});
});
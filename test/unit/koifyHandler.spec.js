'use strict';

let co = require('co');
let ko = require('../..');

describe('koifyHandler', () => {
	let err;
	let req;
	let res;
	let next;

	beforeEach(() => {
		err = new Error('error');

		req = {};

		res = {
			send: sinon.stub(),
			sendStatus: sinon.stub()
		};

		next = sinon.stub();
	});

	describe('generator function result', () => {
		let args;
		let promiseResult;
		let fn;
		let fnGeneratorProto;

		beforeEach(() => {
			args = [req, res, next];

			promiseResult = Promise.resolve();

			fn = function* () {
				return yield promiseResult;
			};

			// generator spy
			fnGeneratorProto = Object.getPrototypeOf(fn());
			sinon.spy(fnGeneratorProto, 'next');

			fn = sinon.spy(fn);
			fn.constructor = (function* () {}).constructor;
		});

		it('is converted to a promise', () => {
			let fnResult = ko.ifyHandler(fn, args);

			expect(fn).to.have.been.calledWithExactly(req, res, next);
			expect(fnGeneratorProto.next).to.have.been.calledOnce;
			expect(fnResult).to.be.a('promise');
		});

		it('is resolvable', co.wrap(function* () {
			promiseResult = Promise.resolve('result');
			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;
			yield expect(fnResult).to.be.eventually.equal('result')
		}));

		it('is rejectable', co.wrap(function* () {
			promiseResult = Promise.reject('result');
			let fnResult = ko.ifyHandler(fn, args);

			// no unhandled rejection for Bluebird
			yield expect(fnResult).to.be.fulfilled;
			yield expect(fnResult).to.be.eventually.equal('result')
		}));
	});

	describe('promise-returning function result', () => {
		let args;
		let fn;

		beforeEach(() => {
			args = [req, res, next];
			fn = sinon.stub();
		});

		it('is converted to a promise', () => {
			fn.returns(Promise.resolve());

			let fnResult = ko.ifyHandler(fn, args);

			expect(fn).to.have.been.calledWithExactly(req, res, next);
			expect(fnResult).to.be.a('promise');
		});

		it('is resolvable', co.wrap(function* () {
			fn.returns(Promise.resolve('result'));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;
			yield expect(fnResult).to.be.eventually.equal('result')
		}));

		it('is rejectable', co.wrap(function* () {
			fn.returns(Promise.reject('result'));

			let fnResult = ko.ifyHandler(fn, args);

			// no unhandled rejection for Bluebird
			yield expect(fnResult).to.be.fulfilled;
			yield expect(fnResult).to.be.eventually.equal('result')
		}));
	});

	describe('regular function result', () => {
		it('passes through', () => {
			let args = [req, res, next];
			let fn = sinon.stub().returns('result');

			let fnResult = ko.ifyHandler(fn, args);

			expect(fn).to.have.been.calledWithExactly(req, res, next);
			expect(fnResult).to.equal('result');
		});
	});

	describe('promise chain', () => {
		let args;
		let fn;

		beforeEach(() => {
			args = [req, res, next];
			fn = sinon.stub();
		});

		it('executes next() on `req` resolution', co.wrap(function* () {
			fn.returns(Promise.resolve(req));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).to.have.been.calledWithExactly();
			expect(res.send).not.to.have.been.called;
		}));

		it('executes next() on `res` resolution', co.wrap(function* () {
			fn.returns(Promise.resolve(res));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).to.have.been.calledWithExactly();
			expect(res.send).not.to.have.been.called;
		}));

		it('executes next() on `next` resolution', co.wrap(function* () {
			fn.returns(Promise.resolve(next));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).to.have.been.calledWithExactly();
			expect(res.send).not.to.have.been.called;
		}));

		it('executes next() on `ko.NEXT` resolution', co.wrap(function* () {
			fn.returns(Promise.resolve(ko.NEXT));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).to.have.been.calledWithExactly();
			expect(res.send).not.to.have.been.called;
		}));

		it('executes next("route") on `ko.NEXT_ROUTE` resolution', co.wrap(function* () {
			fn.returns(Promise.resolve(ko.NEXT_ROUTE));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).to.have.been.calledWithExactly('route');
			expect(res.send).not.to.have.been.called;
		}));

		it('executes next(<error>) on <error> resolution', co.wrap(function* () {
			let error = new Error;
			fn.returns(Promise.resolve(error));

			let fnResult = ko.ifyHandler(fn, args);

			// no unhandled rejection for Bluebird
			yield expect(fnResult).to.be.fulfilled;
			yield expect(fnResult).to.be.eventually.equal(error)

			expect(next).to.have.been.calledWithExactly(error);
			expect(res.send).not.to.have.been.called;
			expect(res.sendStatus).not.to.have.been.called;
		}));

		it('does nothing on `undefined` resolution', co.wrap(function* () {
			fn.returns(Promise.resolve());

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).not.to.have.been.called;
			expect(res.send).not.to.have.been.called;
		}));

		it('executes res.sendStatus on <number> resolution', co.wrap(function* () {
			fn.returns(Promise.resolve(200));

			let fnResult = ko.ifyHandler(fn, args);

			yield expect(fnResult).to.be.fulfilled;

			expect(next).not.to.have.been.called;
			expect(res.sendStatus).to.have.been.calledWithExactly(200);
		}));

		it('executes res.send on other resolution', co.wrap(function* () {
			for (let result of ['', {}, [], false, null]) {
				fn.returns(Promise.resolve(result));

				yield ko.ifyHandler(fn, args);

				expect(res.send).to.have.been.calledWithExactly(result);
			}

			expect(next).not.to.have.been.called;
		}));

		it('executes next(<error>) on rejection', co.wrap(function* () {
			let error = new Error;
			fn.returns(Promise.reject(error));

			let fnResult = ko.ifyHandler(fn, args);

			// no unhandled rejection for Bluebird
			yield expect(fnResult).to.be.fulfilled;
			yield expect(fnResult).to.be.eventually.equal(error)

			expect(next).to.have.been.calledWithExactly(error);
			expect(res.send).not.to.have.been.called;
			expect(res.sendStatus).not.to.have.been.called;
		}));
	});

	it('gets arguments for handler function', co.wrap(function* () {
		let args = [req, res, next];
		let fn = sinon.stub().returns(Promise.resolve(ko.NEXT));

		yield ko.ifyHandler(fn, args);
		expect(next).to.have.been.called;
	}));

	it('gets arguments for error handler function with extra flag', co.wrap(function* () {
		let args = [err, req, res, next];
		let fn = sinon.stub().returns(Promise.resolve(ko.NEXT));

		try {
			yield ko.ifyHandler(fn, args);
		} catch (e) { /* */ }

		expect(next).not.to.have.been.called;

		yield ko.ifyHandler(fn, args, true);
		expect(next).to.have.been.calledOnce;
	}));
});

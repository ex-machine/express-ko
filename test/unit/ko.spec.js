'use strict';

let ko = require('../..');

describe('ko', () => {
	let sandbox;
	let fn;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		sandbox.stub(ko, 'ifyHandler');

		fn = sandbox.stub();
	});

	describe('wrapper function', () => {
		it('has safeguard property', () => {
			let wrappedFn = ko(fn);

			expect(wrappedFn).to.have.property('$$koified', true);
		});

		it('is not double-wrapped', () => {
			let wrappedFn = ko(fn);

			expect(wrappedFn).to.equal(ko(wrappedFn));
		});
	});

	it('skips middleware with safeguard', () => {
		let middleware = sandbox.stub();
		middleware.$$koified = false;

		let wrappedFn = ko(middleware);

		expect(wrappedFn).to.equal(middleware);
	});

	it('wraps handler', () => {
		Object.defineProperty(fn, 'length', { value: 3 });

		let args = new Array(3)
			.fill(null)
			.map(() => sandbox.stub());

		let wrappedFn = ko(fn);

		expect(wrappedFn).not.to.equal(fn);
		expect(wrappedFn).to.have.lengthOf(3);

		let promiseResult = Promise.resolve();
		ko.ifyHandler.returns(promiseResult);

		expect(wrappedFn(...args)).to.equal(promiseResult);
		expect(ko.ifyHandler).to.have.been.calledWithExactly(fn, args);
	});

	it('wraps error handler', () => {
		Object.defineProperty(fn, 'length', { value: 4 });

		let args = new Array(4)
			.fill(null)
			.map(() => sandbox.stub());

		let wrappedFn = ko(fn);

		expect(wrappedFn).not.to.equal(fn);
		expect(wrappedFn).to.have.lengthOf(4);

		let promiseResult = Promise.resolve();
		ko.ifyHandler.returns(promiseResult);

		expect(wrappedFn(...args)).to.equal(promiseResult);
		// isErrHandler flag
		expect(ko.ifyHandler).to.have.been.calledWithExactly(fn, args, true);
	});

	it('wraps param handler', () => {
		Object.defineProperty(fn, 'length', { value: 4 });

		let args = new Array(4)
			.fill(null)
			.map(() => sandbox.stub());

		// isParamHandler flag
		let wrappedFn = ko(fn, true);

		expect(wrappedFn).not.to.equal(fn);
		expect(wrappedFn).to.have.lengthOf(4);

		let promiseResult = Promise.resolve();
		ko.ifyHandler.returns(promiseResult);

		expect(wrappedFn(...args)).to.equal(promiseResult);
		expect(ko.ifyHandler).to.have.been.calledWithExactly(fn, args);
	});

	afterEach(() => {
		sandbox.restore();
	});
});

'use strict';

let express = require('express');
let ko = require('../..');

describe('koify', () => {
	let sandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();

		sandbox.spy(ko, 'ify');
		sandbox.stub(ko, 'ifyRouter');
		sandbox.stub(ko, 'ifyRoute');
	});

	it('skips with no arguments', () => {
		ko.ify();

		expect(ko.ifyRouter).to.not.have.been.called;
		expect(ko.ifyRoute).to.not.have.been.called;

		expect(ko.ify).to.have.returned(undefined);
	});

	it('patches express with koify(express)', () => {
		let Router = express.Router;
		let Route = express.Route;

		ko.ify(express);

		expect(ko.ifyRouter).to.have.been.calledWithExactly(Router);
		expect(ko.ifyRoute).to.have.been.calledWithExactly(Route);

		expect(ko.ify).to.have.returned(Router);
	});

	it('patches express.Router and express.Route with koify(Router, Route)', () => {
		let Router = express.Router;
		let Route = express.Route;

		ko.ify(Router, Route);

		expect(ko.ifyRouter).to.have.been.calledWithExactly(Router);
		expect(ko.ifyRoute).to.have.been.calledWithExactly(Route);

		expect(ko.ify).to.have.returned(Router);
	});

	it('patches express.Router with koify(Router, <falsy>)', () => {
		let Router = express.Router;

		ko.ify(Router, null);

		expect(ko.ifyRouter).to.have.been.calledWithExactly(Router);
		expect(ko.ifyRoute).to.not.have.been.called;

		expect(ko.ify).to.have.returned(Router);
	});

	it('patches express.Route with koify(<falsy>, Route)', () => {
		let Route = express.Route;

		ko.ify(null, Route);

		expect(ko.ifyRouter).to.not.have.been.called;
		expect(ko.ifyRoute).to.have.been.calledWithExactly(Route);

		expect(ko.ify).to.have.returned(null);
	});

	afterEach(() => {
		sandbox.restore();
	});
});

'use strict';

let decache = require('decache');
let http = require('http');
let ko = require('../..');

describe('koifyRoute', () => {
	let express;
	let Route;
	let routePrototype;
	let sandbox;

	let methods = [...http.METHODS, 'all'].map((method) => method.toLowerCase());

	beforeEach(() => {
		express = require('express');
		Route = express.Route;
		routePrototype = Route.prototype;

		sandbox = sinon.sandbox.create();
		sandbox.stub(ko, 'ko');
	});

	describe('route.<method>', () => {
		let originalRouteMethods = {};

		beforeEach(() => {
			for (let method of methods) {
				sandbox.stub(routePrototype, method);
				originalRouteMethods[method] = routePrototype[method];
			}
		});

		it('is patched', () => {
			ko.ifyRoute(Route);

			let route = new Route('/');

			for (let method of methods) {
				expect(route[method]).to.be.a('function');
				expect(route[method]).to.not.equal(originalRouteMethods[method]);
			}
		});
	});

	describe('route.all', () => {
		let originalRouteAll;

		let handlers;
		let koifiedHandlers;

		beforeEach(() => {
			// stub original .use
			sandbox.stub(routePrototype, 'all');
			originalRouteAll = routePrototype.all;

			handlers = new Array(3)
				.fill(null)
				.map(() => sandbox.stub());

			koifiedHandlers = new Array(3)
				.fill(null)
				.map(() => sandbox.stub());
		});

		it('calls the original with koified handler functions', () => {
			koifiedHandlers.forEach((koifiedHandler, i) => ko.ko.onCall(i).returns(koifiedHandler));

			ko.ifyRoute(Route);

			let route = new Route('/');

			route.all(handlers[0], handlers[1], handlers[2]);

			expect(ko.ko).to.have.been.calledThrice;
			expect(originalRouteAll).to.have.been.calledWithExactly(koifiedHandlers[0], koifiedHandlers[1], koifiedHandlers[2]);
		});

		it('returns Route instance', () => {
			let route = new Route('/');

			originalRouteAll.returns(route);

			ko.ifyRoute(Route);

			sandbox.spy(routePrototype, 'all');

			route.all(handlers[0]);

			expect(route.all).to.have.returned(route);
		});
	});

	it('returns Route', () => {
		sandbox.spy(ko, 'ifyRoute');
		ko.ifyRoute(Route);

		expect(ko.ifyRoute).to.have.returned(Route);
	});

	afterEach(() => {
		sandbox.restore();
		decache('express');
	});
});

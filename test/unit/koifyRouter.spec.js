'use strict';

let decache = require('decache');
let ko = require('../..');

describe('koifyRouter', () => {
	let express;
	let Router;
	let routerPrototype;
	let sandbox;

	beforeEach(() => {
		express = require('express');
		routerPrototype = Router = express.Router;

		sandbox = sinon.sandbox.create();
		sandbox.stub(ko, 'ko');
	});

	describe('router.use', () => {
		let originalRouterUse;

		let handlers;
		let koifiedHandlers;

		beforeEach(() => {
			// stub original .use
			sandbox.stub(routerPrototype, 'use');
			originalRouterUse = routerPrototype.use;

			handlers = new Array(3)
				.fill(null)
				.map(() => sandbox.stub());

			koifiedHandlers = new Array(3)
				.fill(null)
				.map(() => sandbox.stub());
		});

		it('is patched', () => {
			ko.ifyRouter(Router);

			let router = Router();

			expect(router.use).to.be.a('function');
			expect(router.use).to.not.equal(originalRouterUse);
		});

		it('calls the original with koified handler functions', () => {
			koifiedHandlers.forEach((koifiedHandler, i) => ko.ko.onCall(i).returns(koifiedHandler));

			ko.ifyRouter(Router);

			let router = Router();

			router.use(handlers[0], handlers[1], handlers[2]);

			expect(ko.ko).to.have.been.calledThrice;
			expect(originalRouterUse).to.have.been.calledWithExactly(koifiedHandlers[0], koifiedHandlers[1], koifiedHandlers[2]);
		});

		it('calls the original with unmodified router instance', () => {
			ko.ko.onCall(0).returns(koifiedHandlers[0]);

			ko.ifyRouter(Router);

			let router = Router();
			let anotherRouter = Router();

			router.use(handlers[0], anotherRouter);

			expect(ko.ko).to.have.been.calledOnce;
			expect(originalRouterUse).to.have.been.calledWithExactly(koifiedHandlers[0], anotherRouter);
		});

		it('returns Router instance', () => {
			let router = Router();

			originalRouterUse.returns(router);

			ko.ifyRouter(Router);

			// spy patched .use
			sandbox.spy(routerPrototype, 'use');

			router.use(handlers[0]);

			expect(router.use).to.have.returned(router);
		});
	});

	describe('router.param', () => {
		let originalRouterParam;

		let handler;
		let koifiedHandler;

		beforeEach(() => {
			// stub original .param
			sandbox.stub(routerPrototype, 'param');
			originalRouterParam = routerPrototype.param;

			handler = sandbox.stub();
			koifiedHandler = sandbox.stub();
		});

		it('is patched', () => {
			ko.ifyRouter(Router);

			let router = Router();

			expect(router.param).to.be.a('function');
			expect(router.param).to.not.equal(originalRouterParam);
		});

		it('calls the original with koified handler function', () => {
			ko.ko.onCall(0).returns(koifiedHandler);

			ko.ifyRouter(Router);

			let router = Router();

			router.param('param', handler);

			expect(ko.ko).to.have.been.calledOnce;
			expect(originalRouterParam).to.have.been.calledWithExactly('param', koifiedHandler);
		});

		it('skips non-handler argument', () => {
			let regexp = new RegExp;

			ko.ifyRouter(Router);

			let router = Router();

			router.param('param', regexp);

			expect(ko.ko).to.not.have.been.called;
			expect(originalRouterParam).to.have.been.calledWithExactly('param', regexp);
		});

		it('ignores deprecated param(callback) call', () => {
			ko.ko.onCall(0).returns(koifiedHandler);

			ko.ifyRouter(Router);

			let router = Router();

			router.param(handler);

			expect(ko.ko).to.not.have.been.called;
			expect(originalRouterParam).to.have.been.calledWithExactly(handler);
		});

		it('returns Router instance', () => {
			let router = Router();

			originalRouterParam.returns(router);

			ko.ifyRouter(Router);

			// spy patched .param
			sandbox.spy(routerPrototype, 'param');

			router.param(handler[0]);

			expect(router.param).to.have.returned(router);
		});
	});

	it('returns Router', () => {
		sandbox.spy(ko, 'ifyRouter');
		ko.ifyRouter(Router);

		expect(ko.ifyRouter).to.have.returned(Router);
	});

	afterEach(() => {
		sandbox.restore();
		decache('express');
	});
});

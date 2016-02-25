'use strict';

let arrayEqual = require('array-equal');
let co = require('co');
let methods = require('methods');

let slice = Array.prototype.slice;

ko.NEXT = Symbol();
ko.NEXT_ROUTE = Symbol();
ko.NO_NEXT = Symbol();

ko.ify = koify;

// exposed for testing
ko.ko = ko;
ko.ifyHandler = koifyHandler;
ko.ifyRouter = koifyRouter;
ko.ifyRoute = koifyRoute;

/**
 * Wraps a generator or promise-returning callback function
 */
function ko(fn, isParamHandler) {
	// handlers and middlewares may have safeguard properties to be skipped
	if ('$$koified' in fn) {
		return fn;
	}

	let handler = function (req, res, next) {
		let argsLength = arguments.length;
		let args = new Array(argsLength);

		for (let i = 0; i < argsLength; i++) {
			args[i] = arguments[i];
		}

		return ko.ifyHandler(fn, args);
	};

	let errHandler = function (err, req, res, next) {
		let argsLength = arguments.length;
		let args = new Array(argsLength);

		for (let i = 0; i < argsLength; i++) {
			args[i] = arguments[i];
		}

		return ko.ifyHandler(fn, args, true);
	};

	let paramHandler = function (req, res, next, val) {
		let argsLength = arguments.length;
		let args = new Array(argsLength);

		for (let i = 0; i < argsLength; i++) {
			args[i] = arguments[i];
		}

		return ko.ifyHandler(fn, args);
	};

	let wrapper;

	// the way Express distinguishes error handlers from regular ones
	if (fn.length === 4) {
		wrapper = isParamHandler ? paramHandler : errHandler;
	} else {
		wrapper = handler;
	}

	// safeguard
	Object.defineProperty(wrapper, '$$koified', {
		configurable: true,
		writable: true,
		value: true
	});

	return wrapper;
}

/**
 * Optionally co-ifies a generator, then chains a promise
 */
function koifyHandler(fn, args, isErrHandler) {
	let fnResult;

	if (isGeneratorFunction(fn)) {
		fnResult = co(function* () {
			return yield* fn(...args);
		});
	} else {
		fnResult = fn(...args);
	}

	if (!isPromise(fnResult)) {
		return fnResult;
	}

	let req, res, next;

	if (isErrHandler) {
		req = args[1];
		res = args[2];
		next = args[3];
	} else {
		req = args[0];
		res = args[1];
		next = args[2];
	}

	return fnResult.then((result) => {
		// implicit 'next'
		if ((result === req) || (result === res)) {
			next();
		// explicit 'next'
		} else if ((isFunction(next) && (result === next)) || (result === ko.NEXT)) {
			next();
		} else if (result === ko.NEXT_ROUTE) {
			next('route');
		} else if (isError(result)) {
			next(result);
		} else if (result !== undefined) {
			if (isNumber(result)) {
				res.sendStatus(result);
			} else {
				res.send(result);
			}
		}

		// exposed for testing
		return result;
	}, (err) => {
		next(err);
		return err;
	});
}

/**
 * Patches Express router
 */
function koify() {
	let args = slice.call(arguments);

	let Router;
	let Route;

	if ((args.length === 1) && ('Router' in args[0]) && ('Route' in args[0])) {
		let express = args[0];
		Router =  express.Router;
		Route =  express.Route;
	} else {
		Router =  args[0];
		Route =  args[1];
	}

	if (Router) {
		ko.ifyRouter(Router);
	}

	if (Route) {
		ko.ifyRoute(Route);
	}

	return Router;
}


/**
 * Patches router methods
 */
function koifyRouter(Router) {
	// router factory function is the prototype
	let routerPrototype = Router;

	// original router methods
	let routerPrototype_ = {};

	// router duck testing
	let routerMethods = Object.keys(routerPrototype).sort();

	function isRouter(someRouter) {
		let someRouterPrototype = Object.getPrototypeOf(someRouter);
		let someRouterMethods = Object.keys(someRouterPrototype).sort();

		return arrayEqual(someRouterMethods, routerMethods) && (typeof someRouterPrototype === 'function');
	}

	routerPrototype_.use = routerPrototype.use;
	routerPrototype.use = function () {
		let args = slice.call(arguments);

		for (let i = 0; i < args.length; i++) {
			let handler = args[i];

			// don't wrap router instances
			if (isFunction(handler) && !isRouter(handler)) {
				args[i] = ko.ko(handler);
			}
		}

		return routerPrototype_.use.apply(this, args);
	};

	routerPrototype_.param = routerPrototype.param;
	routerPrototype.param = function () {
		let args = slice.call(arguments);

		let handler = args[1];

		if (isFunction(handler)) {
			// additional argument to indicate param handler
			args[1] = ko.ko(handler, true);
		}

		return routerPrototype_.param.apply(this, args);
	};

	// safeguard
	Object.defineProperty(routerPrototype, '$$koified', {
		configurable: true,
		writable: true,
		value: false
	});

	return Router;
}

/**
 * Patches route HTTP methods
 */
function koifyRoute(Route) {
	let routePrototype = Route.prototype;
	let routePrototype_ = {};

	for (let method of [...methods, 'all']) {
		routePrototype_[method] = routePrototype[method];
		routePrototype[method] = function () {
			let args = slice.call(arguments);

			for (let i = 0; i < args.length; i++) {
				let handler = args[i];

				if (isFunction(handler)) {
					args[i] = ko.ko(handler);
				}
			}

			return routePrototype_[method].apply(this, args);
		};
	}

	return Route;
}

function isNumber(val) {
	return typeof val === 'number';
}

function isError(obj) {
	return obj instanceof Error;
}

function isFunction(fn) {
	return (typeof fn === 'function');
}

let GeneratorFunction = (function* () {}).constructor;

function isGeneratorFunction(fn) {
	return (typeof fn === 'function') && (fn.constructor === GeneratorFunction);
}

function isPromise(obj) {
	return obj && (typeof obj === 'object') && (typeof obj.then === 'function');
}

module.exports = ko;

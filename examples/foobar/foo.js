'use strict';

let express = require('express');
let ko = require('../..');

let foo = express.Router();

let qux = foo.route('/generous-qux');
let quux = foo.route('/numerous-quux');

foo.all('/vanillic-bar',
	(req, res, next) => {
		next();
	},

	// no implicit next
	(req, res) => res.send('vanillic bar'),

	// idle handler
	(req, res) => {
		res.send('idle bar');
	}
);

foo.all('/promising-baz',
	// implicit next
	// with promised req/res chain
	(req, res) => Promise.resolve(req),
	(req, res) => Promise.resolve(res),

	// explicit next
	() => Promise.resolve(ko.NEXT),
	(req, res, next) => Promise.resolve(next),

	// next route
	() => Promise.resolve(ko.NEXT_ROUTE),

	// idle handler
	(req, res) => {
		res.send('idle baz');
	}
);

foo.get('/promising-baz',
	(req, res) => {
		res.send('promising baz');
	},

	// idle handler
	(req, res) => {
		res.send('idle baz');
	}
);

qux.all(
	// explicit next
	function* (req, res) {
		res.locals.qux = yield new Promise((resolve) => {
			setTimeout(() => resolve('qux'), 20);
		});

		return ko.NEXT;
	},

	// implicit res.send
	function* (req, res) {
		return [`generous ${res.locals.qux}`];
	},

	// no implicit next
	function* () {
		return Promise.resolve();
	},

	// idle handler
	function* (req, res) {
		res.send(['idle qux']);
	}
);

quux.all(
	// implicit next
	function* (req, res) {
		return res.append('quux');
	},

	// implicit res.sendStatus
	function* (req, res) {
		// yield is optional for returned promise
		return yield new Promise((resolve) => {
			setTimeout(() => resolve(202), 20);
		});
	},

	// idle handler
	function* (req, res) {
		res.send(['idle quux']);
	}
)

module.exports = foo;

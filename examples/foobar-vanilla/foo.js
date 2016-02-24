'use strict';

let express = require('express');

let foo = express.Router();

let qux = foo.route('/generous-qux');
let quux = foo.route('/numerous-quux');

foo.all('/vanillic-bar',
	(req, res, next) => {
		next();
	},

	(req, res) => res.send('vanillic bar'),

	(req, res) => {
		res.send('idle bar');
	}
);

foo.all('/promising-baz',
	(req, res, next) => {
		next();
	},

	(req, res, next) => {
		next();
	},

	(req, res, next) => {
		next();
	},

	(req, res, next) => {
		next();
	},

	(req, res, next) => {
		next('route');
	},

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
	function (req, res, next) {
		new Promise((resolve) => {
			setTimeout(() => resolve('qux'), 20);
		})
			.then((result) => {
				res.locals.qux = result;
				next();
			});
	},

	function (req, res, next) {
		res.send([`generous ${res.locals.qux}`]);
		next();
	},

	function () {},

	// idle handler
	function (req, res) {
		res.send(['idle qux']);
	}
);

quux.all(
	function (req, res, next) {
		res.append('quux');
		next();
	},

	function (req, res) {
		new Promise((resolve) => {
			setTimeout(() => resolve(202), 20);
		})
			.then((result) => {
				res.sendStatus(result);
			});
	},

	// idle handler
	function* (req, res) {
		res.send(['idle quux']);
	}
)

module.exports = foo;

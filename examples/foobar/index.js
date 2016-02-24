'use strict';

let express = require('express');
let ko = require('../..');

ko.ify(express);

let app = express();
let isTest = (app.get('env') === 'test');

app.use('/foo', require('./foo'));

app.use('/paramnesic-thud', require('./thud'));

app.all('/erratic-fred',
	// implicit next(error)
	function* (req, res, next) {
		return new Error('fred');
	},

	function* (err, req, res, next)  {
		try {
			var fred = yield Promise.reject(err.message);
			return `unerring ${fred}`;
		} catch (fred) {
			res
				.status(418)
				.send(`erratic ${fred}`);
		}
	}
);

app.use((err, req, res, next) => {
	if (!isTest) {
		return;
	}

	process.nextTick(() => {
		throw err;
	});
});

if (!isTest) {
	app.listen(3000);
}

module.exports = app;

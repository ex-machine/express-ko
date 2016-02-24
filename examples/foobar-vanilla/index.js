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
	(req, res, next) => Promise.resolve(new Error('fred')),

	function (err, req, res, next)  {
		new Promise((resolve, reject) => {
			setTimeout(() => reject(err.message), 20);
		})
			.then((fred) => {
				res.send(`unerring ${fred}`);
			})
			.catch((fred) => {
				res
					.status(418)
					.send(`erratic ${fred}`);
			});
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

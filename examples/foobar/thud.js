'use strict';

let express = require('express');

let thud = express.Router();

thud.param('thud', function* (req, res, next, thud) {
	req.thud = yield new Promise((resolve) => {
		setTimeout(() => resolve(thud), 20);
	});

	return next;
})

thud.all('/:thud', function* (req) {
	return `paramnesic ${req.thud}`;
});

module.exports = thud;

'use strict';

let express = require('express');

let thud = express.Router();

thud.param('thud', function (req, res, next, thud) {
	new Promise((resolve) => {
		setTimeout(() => resolve(thud), 20);
	})
		.then((result) => {
			req.thud = result;
			next();
		});
})

thud.all('/:thud', (req, res) => {
	res.send(`paramnesic ${req.thud}`);
})

module.exports = thud;

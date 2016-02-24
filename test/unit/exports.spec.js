'use strict';

let ko = require('../..');

describe('exports', () => {
	it('is function', () => {
		expect(ko).to.be.a('function');
	});

	it('has ko.ko', () => {
		expect(ko).to.have.property('ko');
		expect(ko.ko).to.be.a('function');
		expect(ko.ko).to.equal(ko);
	});

	it('has ko.ify', () => {
		expect(ko).to.have.property('ify');
		expect(ko.ify).to.be.a('function');
	});

	it('has ko.ifyHandler', () => {
		expect(ko).to.have.property('ifyHandler');
		expect(ko.ifyHandler).to.be.a('function');
	});

	it('has ko.ifyRouter', () => {
		expect(ko).to.have.property('ifyRouter');
		expect(ko.ifyRouter).to.be.a('function');
	});

	it('has ko.ifyRoute', () => {
		expect(ko).to.have.property('ifyRoute');
		expect(ko.ifyRoute).to.be.a('function');
	});
});

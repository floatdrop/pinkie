/* global describe, it */

'use strict';

var assert = require('assert');
var Promise = require('./');

describe("Promise", function () {
	it('should throw on invalid resolver type', function () {
		assert.throws(function () {
			new Promise('unicorns');
		}, /Promise resolver unicorns is not a function/);
	});
});

describe("Promise.all", function () {
	it('should resolve empty array to empty array', function (done) {
		Promise.all([]).then(function (value) {
			assert.deepEqual(value, []);
			done();
		});
	});

	it('should resolve values to array', function (done) {
		Promise.all([1,2,3]).then(function (value) {
			assert.deepEqual(value, [1,2,3]);
			done();
		});
	});

	it('should resolve promises to array', function (done) {
		Promise.all([1,2,3].map(Promise.resolve)).then(function (value) {
			assert.deepEqual(value, [1,2,3]);
			done();
		});
	});

	it('should pass first rejected promise to onReject', function (done) {
		Promise.all([Promise.resolve(1),Promise.reject(2),Promise.reject(3)]).then(function () {
			done('onFullfil called');
		}, function (reason) {
			assert.deepEqual(reason, 2);
			done();
		});
	});
});

function delayedResolve() {
	return new Promise(function (resolve) { setTimeout(resolve, 10); });
}

describe("Promise.race", function () {
	it('empty array should be pending', function (done) {
		var p = Promise.race([]);
		setTimeout(function () {
			assert.deepEqual(p._state, 'pending');
			done();
		}, 5);
	});

	it('should resolve first value', function (done) {
		Promise.race([1,2,3]).then(function (value) {
			assert.deepEqual(value, 1);
			done();
		});
	});

	it('should resolve first promise', function (done) {
		Promise.race([1,2,3].map(Promise.resolve)).then(function (value) {
			assert.deepEqual(value, 1);
			done();
		});
	});

	it('should pass first rejected promise to onReject', function (done) {
		Promise.race([delayedResolve(),delayedResolve(),Promise.reject(3)]).then(function () {
			done('onFullfil called');
		}, function (reason) {
			assert.deepEqual(reason, 3);
			done();
		});
	});
});

describe("Promises/A+ Tests", function () {
	var adapter = {
		deferred: function () {
			var resolve, reject;
			var promise = new Promise(function (res, rej) {
				resolve = res;
				reject = rej;
			});

			return {
				promise: promise,
				resolve: resolve,
				reject: reject
			};
		}
	};

    require("promises-aplus-tests").mocha(adapter);
});

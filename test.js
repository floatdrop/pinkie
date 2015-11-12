/* global describe, it, beforeEach, afterEach*/

'use strict';

var assert = require('assert');
var Promise = require('./');

describe('Promise', function () {
	it('should throw without new', function () {
		assert.throws(function () {
			/* eslint-disable new-cap */
			var promise = Promise(function () {});
			/* eslint-enable new-cap */
			assert.ok(promise);
		}, /Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function\./);
	});

	it('should throw on invalid resolver type', function () {
		assert.throws(function () {
			var promise = new Promise('unicorns');
			assert.ok(promise);
		}, /Promise resolver unicorns is not a function/);
	});

	it('should reject on exception in resolver', function (done) {
		new Promise(function () {
			throw new Error('Bang!');
		})
		.catch(function (err) {
			assert.equal(err.message, 'Bang!');
			done();
		});
	});

	it('should reject on exception in then', function (done) {
		Promise.resolve(1)
			.then(function () {
				throw new Error('Bang!');
			})
			.catch(function (err) {
				assert.equal(err.message, 'Bang!');
				done();
			});
	});

	it('should return Promise from resolve value', function (done) {
		Promise.resolve(Promise.resolve(1))
			.then(function (value) {
				assert.equal(value, 1);
				done();
			});
	});

	// Is it really so? Seems like a bug
	it('should resolve thenable in resolve', function (done) {
		var thenable = {
			then: function (cb) {
				cb(thenable);
			}
		};

		Promise.resolve(thenable).then(function (v) {
			assert.equal(thenable, v);
			done();
		});
	});
});

describe('Promise.all', function () {
	it('should throw error on invalid argument', function () {
		assert.throws(function () {
			Promise.all('unicorns');
		}, /You must pass an array to Promise.all()./);
	});

	it('should resolve empty array to empty array', function (done) {
		Promise.all([]).then(function (value) {
			assert.deepEqual(value, []);
			done();
		});
	});

	it('should resolve values to array', function (done) {
		Promise.all([1, 2, 3]).then(function (value) {
			assert.deepEqual(value, [1, 2, 3]);
			done();
		});
	});

	it('should resolve promises to array', function (done) {
		Promise.all([1, 2, 3].map(Promise.resolve)).then(function (value) {
			assert.deepEqual(value, [1, 2, 3]);
			done();
		});
	});

	it('should pass first rejected promise to onReject', function (done) {
		Promise.all([Promise.resolve(1), Promise.reject(2), Promise.reject(3)]).then(function () {
			done('onFullfil called');
		}, function (reason) {
			assert.deepEqual(reason, 2);
			done();
		});
	});
});

function delayedResolve() {
	return new Promise(function (resolve) {
		setTimeout(resolve, 10);
	});
}

describe('Promise.race', function () {
	it('should throw error on invalid argument', function () {
		assert.throws(function () {
			Promise.race('unicorns');
		}, /You must pass an array to Promise.race()./);
	});

	it('empty array should be pending', function (done) {
		var p = Promise.race([]);
		setTimeout(function () {
			assert.deepEqual(p._state, 'pending');
			done();
		}, 5);
	});

	it('should resolve first value', function (done) {
		Promise.race([1, 2, 3]).then(function (value) {
			assert.deepEqual(value, 1);
			done();
		});
	});

	it('should resolve first promise', function (done) {
		Promise.race([1, 2, 3].map(Promise.resolve)).then(function (value) {
			assert.deepEqual(value, 1);
			done();
		});
	});

	it('should pass first rejected promise to onReject', function (done) {
		Promise.race([delayedResolve(), delayedResolve(), Promise.reject(3)]).then(function () {
			done('onFullfil called');
		}, function (reason) {
			assert.deepEqual(reason, 3);
			done();
		});
	});
});

describe('unhandledRejection/rejectionHandled events', function () {
	var slice = Array.prototype.slice;
	var events;

	function onUnhandledRejection(reason) {
		var args = slice.call(arguments);
		if (reason && reason.message) {
			args[0] = reason.message;
		}
		events.push(['unhandledRejection', args]);
	}

	function onRejectionHandled() {
		events.push(['rejectionHandled', slice.call(arguments)]);
	}

	beforeEach(function () {
		events = [];
		process.on('unhandledRejection', onUnhandledRejection);
		process.on('rejectionHandled', onRejectionHandled);
	});

	afterEach(function () {
		process.removeListener('unhandledRejection', onUnhandledRejection);
		process.removeListener('rejectionHandled', onRejectionHandled);
	});

	it('should emit an unhandledRejection on the next turn', function (done) {
		var promise = Promise.reject(new Error('next'));
		assert.deepEqual(events, []);
		nextLoop(function () {
			assert.deepEqual(events, [
				['unhandledRejection', ['next', promise]]
			]);
			done();
		});
	});

	it('should not emit any events if handled before the next turn', function (done) {
		var promise = Promise.reject(new Error('handled immediately after rejection'));
		promise.catch(function () {});
		nextLoop(function () {
			assert.deepEqual(events, []);
			done();
		});
	});

	it('should emit a rejectionHandled event if handledLater', function (done) {
		var promise = Promise.reject(new Error('eventually handled'));
		nextLoop(function () {
			promise.catch(function () {});
			nextLoop(function () {
				assert.deepEqual(events, [
					['unhandledRejection', ['eventually handled', promise]],
					['rejectionHandled', [promise]]
				]);
				done();
			});
		});
	});

	function nextLoop(fn) {
		setImmediate(fn);
	}
});

describe('Promises/A+ Tests', function () {
	var adapter = {
		deferred: function () {
			var resolve;
			var reject;
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

	require('promises-aplus-tests').mocha(adapter);
});

/* global describe, it */

'use strict';

var assert = require('assert');
var Promise = require('./');

// it('should throw on invalid resolver type', function () {
// 	assert.throws(function () {
// 		new Promise('unicorns');
// 	}, /Promise resolver unicorns is not a function/);
// });

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

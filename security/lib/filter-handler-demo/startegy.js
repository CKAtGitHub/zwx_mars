/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security-handler-demo");


module.exports = function (options) {

    var handler = function handler(req, res, item, params, next) {
        debug("Demo处理器策略");

        next({
            "demo": "run"
        });
    }

    handler._options = options || {};

    return handler;
};




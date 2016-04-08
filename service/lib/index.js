/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var Proxy = require("./proxy");
var ProxyY9 = require("./proxy-strategy-y9");
var ProxyBB8 = require("./proxy-strategy-bb8");
var ProxyZWX = require("./proxy-strategy-zwx");

exports = module.exports;

exports.Proxy = Proxy;
exports.ProxyY9 = ProxyY9;
exports.ProxyBB8 = ProxyBB8;
exports.ProxyZWX = ProxyZWX;
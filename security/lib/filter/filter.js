/*!
 * mars-security
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security");


/**
 * 初始化过滤器, 通过读取的过滤器配置信息，增加安全过滤器。
 * @param app
 * @param options
 *
 */
var proto = module.exports = function (options) {


    debug("创建安全过滤器!");

    /**
     * 返回过滤器中间件
     */
    function filterHandler(app, options) {
        return filterHandler._framework.filter(app, filterHandler, options);
    }

    filterHandler.__proto__ = proto;
    filterHandler._strategies = [];
    filterHandler._stores = [];

    filterHandler.init();
    return filterHandler;
}


proto.init = function init(options) {
    debug("初始化安全过滤器。");
    var options = options || {};
    this._options = options;
    var connect = require("./framework/connect")();
    this._framework = connect;
}

/**
 * 注册过滤处理器
 * @param name
 * @param strategy
 */
proto.use = function use(strategy) {
    if (strategy) {
        this._strategies.push(strategy);
    }

}

/**
 * 注册过滤器配置储存策略
 * @param name
 * @param strategy
 */
proto.store = function store(store) {
    if (store) {
        this._stores.push(store);
    }
}


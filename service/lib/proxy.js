/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("y9-mars-service-proxy");

var proto = module.exports = function (options) {

    function proxy(options) {

        return function (res, req, next) {
            //将当前proxy写入请求对象
            res.y9proxy = proxy;
            next();
        }
    }

    options = options || {};
    proxy.__proto__ = proto;
    proxy._strategies = {};
    proxy._actions = {};

    proxy._actionField = options.actionField || 'y9action';

    return proxy;
}

/**
 * 获取处理器
 * @param type
 * @param options
 */
proto.handler = function handler(name, options) {
    var strategy = this._strategies[name];

    if (!strategy) {
        throw new Error("not found strategy name is " + name);
    }

    //初始化Handler
    var handler = strategy(options);
    handler._strategy = strategy;
    return handler;
}

/**
 * 通名称发送请求
 * @param name
 */
proto.post = function post(name) {
    //查找注册action
    var action = this._actions[name];

    if (!action) {
        throw new Error('can not find action ' + name);
    }

    var handler = this.handler(action.proxy, {
        action: action.action
    }).params(action.params).header(action.header);

    return handler;
}

/**
 * 加载代理策略
 */
proto.use = function use(name, strategy) {
    if (!strategy) {
        strategy = name;
        name = strategy.name;
    }

    if (!name) {
        throw new Error('proxy strategy must have a name');
    }

    this._strategies[name] = strategy;
    return this;
}

/**
 * 注册action
 * @param name
 * @param action
 * @returns {exports}
 */
proto.action = function action(name, action) {

    if (!action) {
        action = name;
        name = action.name;
    }

    if (!name) {
        throw new Error("proxy action must have a name");
    }

    //检查action是否有action,proxy属性
    if (!action.action) {
        throw new Error("proxy action must have a action");
    }

    if (!action.proxy) {
        throw new Error("proxy action must have a proxy");
    }

    //初始化参数
    action.params = action.params || {}

    this._actions[name] = action;

    return this;
}

/**
 * 获取指定名称策略
 * @param name
 * @returns {*}
 * @private
 */
proto._strategy = function _strategy(name) {
    return this._strategies[name];
}

/**
 * 发布服务
 * @param proxyName
 * @returns {Function}
 */
proto.service = function service() {
    var self = this;
    return function (req, res, next) {
        //从请求获取参数
        var action = req.body[self._actionField];

        var errResData = {
            code: "500",
        }

        if (!action) {
            errResData.cause = "请求参数中无法找到名称为:" + self._actionField + "的动作参数."
            res.statusCode = 500;
            res.send(errResData);
            return;
        }

        if (!action.name) {
            errResData.cause = "请求动作必须指定name."
            res.statusCode = 500;
            res.send(errResData);
            return;
        }

        self.post(action.name)
            .params(action.params)
            .header(action.header)
            .launch(function (result) {
                res.send(result.body);
            }, function (error) {
                errResData.cause = error.message;
                res.statusCode = 500;
                res.send(errResData);
            }, function () {
            });
    }
}
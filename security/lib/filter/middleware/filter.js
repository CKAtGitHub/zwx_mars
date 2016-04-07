/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security");
var express = require("express");
var router = express.Router();
var FilterRedirect = require("./filter-redirect");
var Q = require("q");

var registeredRoutes = false;

module.exports = function filter(app, filter, options) {

    //注册过滤器
    reg(app, filter, options);

    return function (req, res, next) {
        debug("安全过滤器中间件.");
        next();
    }
}

function doHandler(filter, item) {

    return function (req, res, next) {
        var attemptIndex = -1;//当前策略下标

        //建立策略包装方法
        var doStartegy = function (startegy) {

            //执行处理器
            var handler = function (params) {
                attemptIndex++;

                var deferred = Q.defer();

                //为策略初始化处理方法
                startegy.error = function (err) {
                    //出现错误,跳出策略执行过程
                    error = error || new Error("exec startegy error.");
                    deferred.reject(err);
                }

                //策略执行过程中需要重定向到指定页面,跳出策略执行
                startegy.redirect = function (url, status) {
                    deferred.reject(new FilterRedirect(url, status));
                }

                //正常执行next
                var nextStartegy = function (params) {
                    deferred.resolve(params);
                }

                startegy.next = nextStartegy;

                //执行策略方法
                startegy(req, res, item, params, nextStartegy);//执行过滤

                return deferred.promise;
            }

            return handler;
        }

        // 开始遍历执行策略
        var attempts = [];

        for (var i = 0; i < filter._strategies.length; i++) {
            attempts.push(doStartegy(filter._strategies[i]));
        }

        attempts.reduce(function (prev, current) {
            return prev.then(current);
        }, Q()).then(function (params) {
                //成功执行,next;
                next();
            }, function (params) {
                if (params) {
                    if (params instanceof  Error) {
                        next(params);
                    } else if (params instanceof FilterRedirect) {
                        res.statusCode = params._state;
                        res.setHeader('Location', params._path);
                        res.setHeader('Content-Length', '0');
                        res.end();
                    } else {
                        //参数无法识别直接next
                        next();
                    }
                } else {
                    //没有代入参数,next
                    next();
                }
            }
        );
    }
}

function reg(app, filter, options) {
    var options = options || {}
        , root = options.root || "/"
        , failureRedirect = "/notRight";

    if (!app) return;
    if (!filter) return;
    if (!filter._stores) return;

    //防止过滤器还没有完全初始化。
    router.all("/*", function (req, res, next) {
        //检查过滤器是否初始化完成.
        if (registeredRoutes) {
            next();
        } else {
            throw new Error("安全过滤器还没有完成初始化！");
        }
    });

    //加载注册安全过滤器

    for (var i = 0; i < filter._stores.length; i++) {
        var item = filter._stores[i];
        if (item) {
            var filterConfigs = item();

            for (var j = 0; j < filterConfigs.all.length; j++) {
                var filterItem = filterConfigs.all[j];
                debug("开始注册all安全过滤路径:" + filterItem.path);
                router.all(filterItem.path, doHandler(filter, filterItem));
            }

            for (var j = 0; j < filterConfigs.get.length; j++) {
                var filterItem = filterConfigs.get[j];
                debug("开始注册get安全过滤路径:" + filterItem.path);
                router.get(filterItem.path, doHandler(filter, filterItem));
            }

            for (var j = 0; j < filterConfigs.post.length; j++) {
                var filterItem = filterConfigs.post[j];
                debug("开始注册post安全过滤路径:" + filterItem.path);
                router.post(filterItem.path, doHandler(filter, filterItem));
            }
        }
    }
    //添加到app
    app.use(root, router);
    registeredRoutes = true;
}

/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security-local");

exports = module.exports = function (options) {

    /**
     * 根据是否是biz开头决定是不是admin
     */
    function getRedirect(req,redirects) {
        if (req.url.indexOf("/biz") != -1) {
            return redirects.admin || redirects.default
        }
        if (req.url.indexOf("/merchant") != -1) {
            return redirects.merchant || redirects.default
        }
        return redirects.default;
    }
    var handler = function (req, res, item, params, next) {
        debug("执行本地过滤器策略！");
        //检查是否要求登录系统
        if (item.needLogin) {
            debug("路径:" + item.path + ",要求登录系统，开始检查登录信息.");

            handler._validLogin(req, item, function (pass) {
                if (pass) {
                    debug("已经登录系统！");
                    next();
                } else {
                    debug("未登录系统！");
                    if (typeof handler._failureRedirect == 'string') {
                        handler.redirect(handler._failureRedirect);
                    } else if (typeof handler._failureRedirect == 'object') {
                        handler.redirect(getRedirect(req,handler._failureRedirect));
                    }
                }
            });
        } else {
            debug("路径:" + item.path + ",不要求登录系统，跳过检查.")
            next()
        }
    }

    var options = options || {}
        , validLogin = options.validLogin || function (req, item, done) {
                if (req.isAuthenticated()) {
                    done(true);
                } else {
                    done(false);
                }
            }
        , failureRedirect = options.failureRedirect || "/login";

    handler._validLogin = validLogin;
    handler._failureRedirect = failureRedirect;

    return handler;
};



/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security-local");

exports = module.exports = function (options) {

    /**
     * 根据设备信息，决定调整地址
     */
    function getDeviceRedirect(req,redirects) {
        // 微信内置浏览器：
        redirects.micromessenger = redirects.micromessenger || redirects.weixin;
        var deviceAgent = req.headers["user-agent"].toLowerCase();
        for (var r in redirects) {
            if (deviceAgent.match(r.toLowerCase()) && redirects[r]) {
                return redirects[r];
            }
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
                        handler.redirect(getDeviceRedirect(req,handler._failureRedirect));
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



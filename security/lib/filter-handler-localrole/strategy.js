/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security-local-role");
var y9util = require("zwx-mars-util");

exports = module.exports = function (options) {

    var handler = function handler(req, res, item, params, next) {
        //检查是否要求登录系统
        if (item.role && item.role.length > 0) {
            debug("路径:" + item.path + ",要求检查角色.");

            handler._validRole(req, item, function (pass) {
                if (pass) {
                    debug("角色验证通过！");
                    next();
                } else {
                    debug("角色验证失败!");
                    handler.redirect(handler._failureRedirect);
                }
            });
        } else {
            debug("路径:" + item.path + ",不要求角色验证，跳过检查.")
            next();
        }
    };

    var options = options || {}
        , validRole = options.validRole || function (req, item, done) {
                var property = 'user';
                if (req._passport && req._passport.instance) {
                    property = req._passport.instance._userProperty || 'user';
                }

                var userInfo = req[property];

                if (item && item.role && item.role.length > 0) {
                    if (userInfo && userInfo.role) {
                        if (y9util.Array.contains(item.role, userInfo.role)) {
                            done(true);
                        } else {
                            done(false);
                        }
                    } else {
                        done(false);
                    }
                } else {
                    //当前页面没有限定访问角色
                    done(true);
                }
            }
        , failureRedirect = options.failureRedirect || "/access-denied";

    handler._validRole = validRole;
    handler._failureRedirect = failureRedirect;

    return handler;
};


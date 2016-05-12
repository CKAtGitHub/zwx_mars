/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var debug = require("debug")("zwx-mars-security-local-integrity");
var y9util = require("zwx-mars-util");

exports = module.exports = function (options) {

    var handler = function handler(req, res, item, params, next) {
        //检查是否要求登录系统
        if (item.integrity && item.integrity.length > 0) {
            debug("路径:" + item.path + ",要求检查数据完整性.");

            handler._validIntegrity(req, item, function (pass,errorRole) {
                if (pass) {
                    debug("数据完整性验证通过！");
                    next();
                } else {
                    debug("数据完整性验证失败!");
                    handler.redirect(handler._failureRedirect[errorRole]);
                }
            });
        } else {
            debug("路径:" + item.path + ",不要求数据完整性验证，跳过检查.");
            next();
        }
    };

    var validateMethods = {
        password:function(userInfo) {
            return !!userInfo.password;
        },
        workerInfo:function(userInfo){
            return !!userInfo.workCateName;
        },
        merchantInfo:function(userInfo) {
            return !!userInfo.managescope;
        }
        }
    ;

    var options = options || {}
        , validIntegrity = options.validIntegrity || function (req, item, done) {
                var property = 'user';
                if (req._passport && req._passport.instance) {
                    property = req._passport.instance._userProperty || 'user';
                }
                var userInfo = req[property];
                if (item && item.integrity && item.integrity.length > 0) {
                    for (var i = 0;i < item.integrity.length;i++) {
                         if (!(validateMethods[item.integrity[i]] &&
                             validateMethods[item.integrity[i]](userInfo))) {
                             done(false,key);
                             return;
                         }
                    }
                    done(true);
                } else {
                    //当前页面没有限定访问角色
                    done(true);
                }
            }
        , failureRedirect = options.failureRedirect;

    handler._validIntegrity = validIntegrity;
    handler._failureRedirect = failureRedirect;

    return handler;
};


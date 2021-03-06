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
                    if (req.session && !req.session.bizReturnTo) {
                        req.session.bizReturnTo = req.url;
                        req.session.bizReturnToFrom = 'login';
                    }
                    handler.redirect(handler._failureRedirect[errorRole]);
                }
            });
        } else {
            debug("路径:" + item.path + ",不要求数据完整性验证，跳过检查.");
            next();
        }
    };

    var validateMethods = {
        password:function(userInfo,roleInfo) {
            return !!userInfo.password;
        },
        passwordWorker:function(userInfo,roleInfo) {
            if (roleInfo.code != 'worker') {
                return true;
            }
            return !!userInfo.password;
        },
        passwordMerchant:function(userInfo,roleInfo) {
            if (roleInfo.code != 'merchant') {
                return true;
            }
            return !!userInfo.password;
        },
        workerInfo:function(userInfo,roleInfo){             //此策略暂停使用
            if (roleInfo.code != 'worker') {
                return true;
            }
            return  !!userInfo.trueName;
        },
        workerServerInfo:function(userInfo,roleInfo){       //服务城市、服务区域
            if (roleInfo.code !='worker'){return true;}
            return !!(userInfo.cityId && userInfo.serviceDistrictIds);
        },
        workerSkillsInfo:function(userInfo,roleInfo){       //主要技能
            if (roleInfo.code !='worker'){return true;}
            return !!(userInfo.primaryskill);
        },
        merchantInfo:function(userInfo,roleInfo) {
            if (roleInfo.code != 'merchant') {
                return true;
            }
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
                if (!userInfo) {
                    done(true);
                    return;
                }
                var session = req.session || {};
                var roleInfo = session.roleInfo || {};
                if (item && item.integrity && item.integrity.length > 0) {
                    for (var i = 0;i < item.integrity.length;i++) {
                         if (!(options.validateMethods[item.integrity[i]] &&
                             options.validateMethods[item.integrity[i]](userInfo,roleInfo))) {
                             done(false,item.integrity[i]);
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

    options.validateMethods = options.validateMethods || validateMethods;
    handler._validIntegrity = validIntegrity;
    handler._failureRedirect = failureRedirect;

    return handler;
};


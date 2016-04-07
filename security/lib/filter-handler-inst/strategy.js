/**
 * Created by leon on 15/11/18.
 */

'use strict';

var debug = require("debug")("zwx-mars-security-handler-inst");


module.exports = function (options) {

    var options = options || {}
        , validInst = options.validInst || function (req, item, done) {
                if (req.isExistInst()) {
                    done(true);
                } else {
                    done(false);
                }
            }
        , failureRedirect = options.failureRedirect || "/select-inst";

    var handler = function (req, res, item, params, next) {
        debug("执行本地过滤器策略！");
        //检查是否要求登录系统
        if (item.needInst) {
            debug("路径:" + item.path + ",要求机构信息，开始检查机构信息.");

            handler._validInst(req, item, function (pass) {
                if (pass) {
                    debug("已经存在机构信息！");
                    next();
                } else {
                    debug("尚未设置机构信息跳转到机构设置！");
                    handler.redirect(handler._failureRedirect);
                }
            });
        } else {
            debug("路径:" + item.path + ",不要求机构信息，跳过检查.")
            next()
        }
    };

    handler._validInst = validInst;
    handler._failureRedirect = failureRedirect;

    return handler;
};
/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';
var superagent = require("superagent");
var proxyStrategy = require("../proxy-strategy");
var util = require("util");
var debug = require("debug")("zwx-mars-service-proxy-strategy-zwx");

var proto = module.exports = function (options) {
    function ZWX(options) {
        //返回处理器
        var handler = new Handler(options);
        return handler;
    }

    ZWX.__proto__ = proto;

    var options = options || {},
        token = options.token || undefined,
        AppID = options.AppID || undefined,
        AppSecret = options.AppSecret || undefined,
        baseurl = options.baseurl || undefined;

    if (!token) {
        throw new Error("must set token!");
    }

    if (!AppID) {
        throw new Error("must set AppID!");
    }

    if (!AppSecret) {
        throw new Error("must set AppSecret!");
    }

    if (!baseurl) {
        throw new Error("must set baseurl!");
    }

    ZWX._options = options;
    ZWX._token = token;
    ZWX._baseurl = baseurl;
    ZWX._AppID = AppID;
    ZWX._AppSecret = AppSecret;

    return ZWX;
};

function Handler(options) {
    this._options = options || {};

    var action = this._options["action"] || undefined;

    if (!action) {
        throw new Error("must set action!");
    }

    this._action = action;

    proxyStrategy.call(this);
}
/**
 * 继承自 `ProxyStrategy`.
 */
util.inherits(Handler, proxyStrategy);


Handler.prototype.launch = function launch(success, failed, done) {
    var self = this;
    var data = {
        token: self._strategy._token,
        pageInfo: self._header.pageInfo||{},
        data: self._params
    };

    debug("执行服务调用.", data);
    superagent.post(self._strategy._baseurl+this._action)
        .auth(this._strategy._AppID, this._strategy._AppSecret)
        .send(data)
        .set('Content-Type', 'application/json;charset=UTF-8')
        .end(function (err, res) {
            if (res && res.text){
                res.body = JSON.parse(res.text);
                if (res && res.ok) {
                    if (res.body.status === "100") {
                        if (success) {
                            success(res);
                        }
                    } else {
                        if (res.body){
                            if (parseInt(res.body.status) > 0){
                                res.body.status = res.body.status || "100";
                            }else{
                                res.body.zz_status = '100';
                            }
                            if (success){
                                success(res);
                            }
                        }else{
                            if (failed) {
                                failed(new Error(res.body.cause), res);
                            }
                        }
                    }
                } else {
                    if (failed) {
                        failed(err, res);
                    }
                }
            }else{
                failed(new Error("请求服务失败!"),res);
            }
            if (done) {
                done();
            }
        });
};

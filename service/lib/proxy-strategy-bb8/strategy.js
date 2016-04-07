/**
 * Created by leon on 16/2/22.
 */


'use strict';

var superagent = require("superagent");
var proxyStrategy = require("../proxy-strategy");
var util = require("util");
var debug = require("debug")("zwx-mars-service-proxy-strategy-bb8");

var proto = module.exports = function (options) {
    function BB8(options) {
        //返回处理器
        var handler = new Handler(options);
        return handler;
    }

    BB8.__proto__ = proto;

    var options = options || {},
        AppID = options.AppID || undefined,
        AppSecret = options.AppSecret || undefined,
        baseurl = options.baseurl || undefined;

    if (!AppID) {
        throw new Error("must set AppID!");
    }

    if (!AppSecret) {
        throw new Error("must set AppSecret!");
    }

    if (!baseurl) {
        throw new Error("must set baseurl!");
    }

    BB8._options = options;
    BB8._AppID = AppID;
    BB8._AppSecret = AppSecret;
    BB8._baseurl = baseurl;

    return BB8;
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
    var requestType = this._action.requestType || "get";
    var path = this._action.path;
    if (this._params) {
        var tempKey;
        for (var key in this._params) {
            tempKey = "{"+key+"}";
            if (path.indexOf(tempKey) > 0) {
                path = path.replace(tempKey,this._params[key]);
                delete this._params[key];
            }
        }
        path = path.replace(/\/{[^}]*}/,""); // 删除没有匹配到变量
    }
    var url = this._strategy._baseurl + path;

    var theRequest;
    if (requestType == 'post' || requestType == 'put') {
        theRequest = superagent[requestType](url,this._params || {});
    } else {
        theRequest = superagent[requestType](url);
    }
    theRequest.set('Content-Type', 'application/json;charset=UTF-8')
        .auth(this._strategy._AppID, this._strategy._AppSecret)
        .query(this._params || {})
        .end(function (err, res) {
            if (res && res.ok) {
                if (!res.body.data) {
                    var tbody = res.body;
                    res.body = {};
                    res.body.data = tbody;
                }
                if (res.statusCode === 200) {
                    //由于其他框架依靠code检查是否成功
                    res.body.code = "100";
                    if (success) {
                        success(res);
                    }
                } else {
                    res.body.code = res.statusCode;
                    if (failed) {
                        failed(new Error(res.body.cause), res);
                    }
                }
            } else {
                if (failed) {
                    failed(err, res);
                }
            }
            if (done) {
                done();
            }
        })
};
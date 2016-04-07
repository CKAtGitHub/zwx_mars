/**
 * Created by leon on 15/11/19.
 */

var Y9Util = require("zwx-mars-util");

exports = module.exports = InstPassport;

function InstPassport() {
    this._key = "instPassport";
    this._instField = "instid";
    this._deserializeUser = null;
    this._instProperty = "inst";
    this.init();
};

InstPassport.prototype.init = function () {
    var http = require('http');
    var self = this;

    //扩展检查是否存在机构信息的检查服务
    http.IncomingMessage.prototype.isExisInst = function () {
        return (this.session && this.session[self._key] && this.session[self._key][self._instProperty]) ? true : false;
    }

    http.IncomingMessage.prototype.logoutInst = function () {
        if (this.session && this.session[self._key] && this.session[self._key]) {
            delete this.session[self._key];
        }
    }
};

InstPassport.prototype.deserializeUser = function (fn, user, done) {
    if (typeof fn === "function") {
        this._deserializeUser = fn;
        return;
    }

    var inst = fn;

    this._deserializeUser(inst, user, function (error, inst) {
        done(error, inst);
    });
};

InstPassport.prototype.setInst = function (options) {
    var self = this;

    options = options || {};
    self._instField = options.instField || self._instField;

    return function (req, res, next) {
        var instid = Y9Util.Common.lookup(req.body, self._instField) || Y9Util.Common.lookup(req.query, self._instField);

        self.deserializeUser(instid, req.user, function (error, inst) {
            if (error) {
                next(error);
            } else {
                if (req.session) {
                    if (!req._instPassport.session) {
                        req._instPassport.session = {};
                    }
                    req._instPassport.session.inst = inst;

                    req.session[self._key] = req._instPassport.session;

                    if (options.successReturnToOrRedirect) {
                        var url = options.successReturnToOrRedirect;
                        if (req.session && req.session.returnTo) {
                            url = req.session.returnTo;
                            delete req.session.returnTo;
                        }
                        return res.redirect(url);
                    }
                }
                next();
            }
        });
    }
};

InstPassport.prototype.initialize = function (options) {
    var self = this;

    return function initialize(req, res, next) {
        //将passport实例绑定到req
        req._instPassport = {};
        req._instPassport.instance = self;

        //如果在session中存在机构信息则记录
        if (req.session && req.session[self._key]) {
            req._instPassport.session = req.session[self._key];
            req[self._instProperty] = req.session[self._key][self._instProperty];
        }

        next();
    }
};

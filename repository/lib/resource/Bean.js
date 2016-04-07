/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';


var marsUtil = require('zwx-mars-util');
var Q = require("q");

/**
 * 数据强制依靠dataReadyFn返回，
 * 导出方法不直接返回数据
 * @type {Function}
 */
var proto = module.exports = function (model, meta, dataReadyFn) {
    var bean = function () {
    }
    bean.__proto__ = proto;
    bean._model = model;
    bean._meta = meta;
    bean._data = {};
    bean._dataReadyFn = dataReadyFn;
    bean.init();
}

proto.init = function () {
    if (!this._model || !this._meta) {
        throw new Error('入参错误，无法创建Resource对象');
    }
    if (!this._dataReadyFn || typeof this._dataReadyFn != 'function') {
        throw new Error('入参错误，无效的dataReadyFn函数，无法创建Resource对象');
    }
    this._convertData();
}

/**
 * 将data数据进行处理，并添加到当前Resource对象
 */
proto._convertData = function (data, meta, fields, convertCallbackFn) {
    data = data || this._data;
    fields = fields || this._model.getConfig().fields;
    meta = meta || this._meta;
    var self = this;
    var index = -1;
    var convertField = function () {
        index++;
        var defered = Q.defer();
        var field = fields[index];
        var doConvert = function () {
            if (field.convert
                && meta[field.name]) {
                var convertFn = self._model.converts[field.convert];
                if (!convertFn || typeof convertFn != 'function') {
                    var err = new Error('无效的转换函数：' + field.convert);
                    done(err, data);
                    defered.reject(err);
                } else {
                    convertFn(meta[field.name], meta, function (ret) {
                        if (ret instanceof Error) {
                            done(ret, data);
                            defered.reject(ret);
                        } else {
                            data[field.name] = ret;
                            defered.resolve();
                        }
                    });
                }

            } else if (field.type == 'object'
                && meta[field.name]
                && (field.ref || field.model)) {
                data[field.name] = {};
                var childFields = field.model ? field.model.fields
                    : self._model.y9Repository.get(field.ref).getConfig().fields;
                self._convertData(data[field.name], meta[field.name], childFields, function (err, data) {
                    if (err) {
                        defered.reject();
                        self._dataReadyFn(err, self);
                        delete self._model;
                        delete self._dataReadyFn;
                    } else {
                        defered.resolve();
                    }
                });
            } else if (field.type == 'array'
                && meta[field.name]
                && (field.ref || field.model)) {

                data[field.name] = [];
                var childMetas = meta[field.name];
                var childDatas = data[field.name];
                var childFields = field.model ? field.model.fields
                    : self._model.y9Repository.get(field.ref).getConfig().fields;

                var index = -1;
                var convertChildData = function() {
                    index ++;
                    var childMeta = childMetas[index];
                    var childDefered = Q.defer();
                    self._convertData({}, childMeta, childFields, function (err, data) {
                        if (err) {
                            childDefered.reject();
                            defered.reject();
                            self._dataReadyFn(err, self);
                            delete self._model;
                            delete self._dataReadyFn;
                        } else {
                            childDatas.push(data);
                            childDefered.resolve();
                        }
                    });
                    return childDefered.promise;
                }
                var fns = marsUtil.Common.createMethodArray(convertChildData,childMetas.length);
                fns.reduce(function(prev,current) {
                    return prev.then(current);
                },Q()).then(function() {
                    defered.resolve();
                });
            } else {
                data[field.name] = meta[field.name];
                defered.resolve();
            }
        }
        doConvert();
        return defered.promise;
    }
    var done = convertCallbackFn || function (err, dd) {
            marsUtil.Merge(self, dd);
            self._dataReadyFn(err, self);
            delete self._model;
            delete self._dataReadyFn;
        }
    var fns = marsUtil.Common.createMethodArray(convertField, fields.length);
    fns.push(function () {
        done(null, data);
    });
    fns.reduce(function (prev, current) {
        return prev.then(current);
    }, Q());
}

/**
 * 根据名称获取值
 * @param name
 */
proto.get = function(name,data) {
    data = data ||this._data;
    if(name && name.indexOf(".") > 0) {
        var ns = name.split(".");
        data = this.get(ns[0],data);
        ns = ns.slice(1);
        return data?this.get(ns.join("."),data):undefined;
    }
    return name ? data[name] : data;
}

/**
 * 获取资源对象的元数据
 */
proto.getMeta = function(name,meta) {
    meta = meta || this._meta;
    if(name && name.indexOf(".") > 0) {
        var ns = name.split(".");
        meta = this.get(ns[0],meta);
        ns.slice(0,1);
        return meta?this.get(ns.join("."),meta):undefined;
    }
    return name ? meta[name] : meta;
}
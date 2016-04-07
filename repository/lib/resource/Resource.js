/*!
 * mars
 * Copyright(c) 2015 huangbinglong
 * MIT Licensed
 */

'use strict';

var marsUtil = require('zwx-mars-util');
var util = require('util');
var Q = require("q");
var Bean = require('./Bean');

var proto = module.exports = function (model, respBody,dataReadyFn) {
    var resource = function(body,fn) {
        resource._beans = [];
        resource._caches = body.cache||{};
        resource.rows = [];
        resource._dataReadyFn = fn||resource._dataReadyFn;
        resource.buildRows(body.data);
    }
    respBody = respBody||{};
    resource.__proto__ = proto;
    resource._model = model;
    resource._beans = [];
    resource._header = [];
    resource._rows = [];
    resource._caches = respBody.cache||{};
    resource._dataReadyFn = dataReadyFn;
    resource.init(respBody.data);
}

/**
 * 初始化
 */
proto.init = function(data) {
    var self = this;

    var buildHeader = function(fields) {
        var header = [];
        fields.forEach(function(field) {
            if (field.ref) {
                var model = self._model.y9Repository.get(field.ref);
                var headField = marsUtil.Merge({},field);
                delete headField.ref;
                headField.fields = buildHeader(model.getConfig()['fields']);
                header.push(headField);
            } else {
                header.push(marsUtil.Merge({},field));
            }
        });
        return header;
    }
    this._header = buildHeader(this._model.getConfig().fields);
    this.buildRows(data);
}

proto.buildRows = function (data) {
    if (!data) {
       return this._dataReadyFn(null,this);
    }
    if (!util.isArray(data)) {
        data = [data];
    }
    var self = this;
    // 根据bean创建row
    var buildRow = function(bData,header) {
        header = header || self.getHeader();
        var row = [];
        var field;
        for (var name in bData) {
            field = self.getField(name,header);
            if (!field) {
                continue;
            }
            if (field.type == 'object'
                && field.fields
                && field.fields.length > 0
                && bData[name]) {
                row.push({
                    name:name,
                    label:field.label,
                    value:buildRow(bData[name],field.fields)
                });
            } else if (field.type == 'array'
                && field.fields
                && field.fields.length > 0
                && bData[name]
                && bData[name].length > 0) {
                var per = {
                    name:name,
                    label:field.label,
                    value:[]
                };
                bData[name].forEach(function(arrayData) {
                    per.value.push(buildRow(arrayData,field.fields))
                });
                row.push(per);
            } else {
                row.push({
                    name:name,
                    label:field.label,
                    value:bData[name]
                });
            }
        }
        return row;
    }
    var index = -1;
    var buildBean = function() {
        index++;
        var meta = data[index];
        var defered = Q.defer();
        Bean(self._model,meta,function(err,b) {
            if (err) {
                defered.reject(err);
            } else {
                self._beans.push(b);
                self._rows.push(buildRow(b.get()));
                defered.resolve();
            }
        });
        return defered.promise;
    }
    var fns = marsUtil.Common.createMethodArray(buildBean,data.length);
    fns.reduce(function(prev,current) {
        return prev.then(current);
    },Q()).then(function() {
        self.done();
    });
}

proto.done = function() {
    this._dataReadyFn(null,this);
    delete this._model;
    delete this._dataReadyFn;
}

proto.getBean = function(index) {
    return this._beans[index];
}

/**
 * 根据字段名称，获取字段定义
 * @param name 字段名称
 * @returns {*}
 */
proto.getField = function(name,header) {
    header = header || this.getHeader();
    if (name.indexOf('.') > 0) {
        var ns = name.split(".");
        var field = this.getField(ns[0],header);
        ns = ns.slice(1);
        return this.getField(ns.join("."),field.fields);
    }
    var field;
    header.forEach(function(f) {
        if (f.name === name) {
            field = f;
            return;
        }
    });
    return field;
}

proto.get = function(name,index) {
    index = index || 0;
    var bean = this.getBean(index);
    return bean?bean.get(name):undefined;
}

proto.getMeta = function(name,index) {
    index = index || 0;
    var bean = this.getBean(index);
    return bean?bean.getMeta(name):undefined;
}

proto.getHeader = function() {
    return this._header;
}

proto.getRows = function() {
    return this._rows;
}

/**
 * 获取缓冲
 * @param type
 * @param code
 */
proto.getCache = function(type,code) {
    var cache = this._caches[type];
    return cache?cache[code]:undefined;
}

proto.toJSON = function() {
    var self = this;
    return {
        header:self.getHeader(),
        rows:self.getRows(),
        caches:self._caches
    };
}
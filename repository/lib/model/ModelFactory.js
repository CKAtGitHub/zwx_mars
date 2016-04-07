/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';
var debug = require("debug")("mars-repository-model");
var model = require('./Model');
var marsUtil = require('zwx-mars-util');

var proto = module.exports = function (options) {

    var modelFactory = function () {
    }

    modelFactory.__proto__ = proto;
    modelFactory._options = options || {};
    modelFactory._models = [];
    modelFactory.converts = {};

    modelFactory.init();

    return modelFactory;
}

proto.init = function init() {
    debug("初始化Model.");
}

/**
 * 注册模型
 * @param name
 * @param modelConfig
 * @returns {Model}
 */
proto.reg = function reg(name, modelConfig) {
    debug("注册Model，名称：" + name);

    var _m;
    if (!modelConfig && typeof name == 'function') {
        _m = name;
        name = _m.modelName;
    } else if (!modelConfig) {
        modelConfig = name;
        name = modelConfig.name;
    } else {
        modelConfig.name = name;
    }

    if (!name) {
        throw new Error('Model must have a name');
    }
    if (!_m) {
        _m = model(modelConfig);
    }

    marsUtil.Merge(_m.converts, this.converts, false);
    this._models.push(_m);
    return this;
}

/**
 * 根据modelName获取model
 * @param name model名称
 * @returns {*}
 */
proto.get = function get(name) {
    debug("获取名称为：" + name + "，的Model配置。");

    var lastModel = undefined;

    this._models.map(function (item, i) {
        if (item.modelName === name) {
            lastModel =  item;
        }
    }, this);

    return lastModel;
}

/**
 * 获取所有model
 * @returns {*}
 */
proto.all = function all() {
    return this._models;
}

/**
 * 注册转换器
 * @param name 转换器名称
 * @param callback 转换器函数(字段原始值，原始数据对象)
 */
proto.convert = function (name,callback) {
    if (name && callback) {
        this.converts[name] = callback;
        return this;
    }
    throw new Error('无效的Convert');
}
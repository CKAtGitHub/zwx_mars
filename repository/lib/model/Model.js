/*!
 * mars
 * Copyright(c) 2015 Leon Huang
 * MIT Licensed
 */

'use strict';

var resource = require('../resource');
var util = require('util');
var marsUtil = require('zwx-mars-util');
var Q = require("q");

var proto = module.exports = function (options) {

    var model = function(data,dataReadyFn) {
        model.verify(data.data);
        return resource(model,data,dataReadyFn);
    }

    model.__proto__ = proto;
    model._options = options;
    model.converts = options.converts||{};

    model.init();

    return model;
}

/**
 * 初始化model
 * 校验配置
 */
proto.init = function init() {

    configModel.verify(this._options);

    this.modelName = this._options['name'];
    this._options.converts = this._options.converts ||[];
}

/**
 * 获取model原始配置
 * @returns {*}
 */
proto.getConfig = function() {
    return this._options;
}

/**
 * 校验数据是否符合model要求的格式
 * @param data 原始数据
 */
proto.verify = function(data) {
    if (!data) {
        throw new Error(this.modelName +'无效的原始数据对象');
    }
    if (util.isArray(data)) {
        var self = this;
        return data.forEach(function(dd) {
            self.verify(dd);
        });
    }
    var self = this;
    var hasOwnProperty = Object.prototype.hasOwnProperty
    var verifyField = function(field,obj) {
        // 校验是否为空
        if (field.required
            && !hasOwnProperty.call(obj,field.name)) {
            throw new Error(self.modelName+"," +field.name+' 字段不能为空')
        }
        if (hasOwnProperty.call(obj,field.name)
            && obj[field.name] != undefined
            && obj[field.name] != null) {
            // 校验类型是否正确
            if (field.type == 'boolean'
            && !util.isBoolean(obj[field.name])){
                throw new Error(self.modelName+"," +field.name+' 字段必须为boolean类型');
            } else if (field.type == 'number'
                && !util.isNumber(obj[field.name])) {
                throw new Error(self.modelName+"," +field.name+' 字段必须为number类型');
            } else if (field.type == 'string'
                && !util.isString(obj[field.name])) {
                throw new Error(self.modelName+"," +field.name+' 字段必须为string类型');
            } else if (field.type == 'object') {
                if (!util.isObject(obj[field.name])){
                    throw new Error(self.modelName+"," +field.name+' 字段必须为object类型');
                }
                if (field.ref) {
                    var m = self.y9Repository.get(field.ref);
                    m.verify(data[field.name]);
                } else if (field.model && field.model.fields) {
                    field.model.fields.forEach(function(childField) {
                        verifyField(childField,data[field.name]);
                    });
                }

            } else if (field.type == 'array') {
                if (!util.isArray(obj[field.name])) {
                    throw new Error(self.modelName+"," +field.name+' 字段必须为array类型');
                }
                if (field.ref) {
                    var m = self.y9Repository.get(field.ref);
                    data[field.name].forEach(function(arrayData) {
                        m.verify(arrayData);
                    });
                } else if (field.model && field.model.fields) {
                    data[field.name].forEach(function(arrayData) {
                        field.model.fields.forEach(function(childField) {
                            verifyField(childField,arrayData);
                        });
                    });
                }
            }
        }

    }
    this.getConfig().fields.forEach(function(field) {
        verifyField(field,data)
    });
    return true;
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
    throw new Error(this.modelName+"," +this.modelName+' 无效的Convert');
}


/**
 * 根据参数查找一个资源
 * @param proxy 代理对象
 * @param params 查询条件
 * @param callback 回调函数
 */
proto.action = function(proxy,params,callback) {
    if (!this._options.proxy) {
        throw new Err('Model:'+this._modelName+",未配置proxy");
    }
    var proxyConfig = this._options.proxy;
    var self = this;
    var oneParams = {};
    if (proxyConfig.params) {
        marsUtil.Merge(oneParams,proxyConfig.params);
    }
    if (params) {
        marsUtil.Merge(oneParams,params);
    }
    proxy.handler(proxyConfig.type,{
        action:proxyConfig.action
    }).params(oneParams).launch(function(result){
        self.toResource(result.body,callback);
    },function(err,result){
        resource(self,undefined,function(e,res) {
            callback(err,res);
        });
    },function() {
        // do nothing
    });
}

/**
 * .........数据操作方法..
 * **/

/**
 * 将原始数据对象转换为Resource对象
 * @param data
 * @param dataReadyFn
 */
proto.toResource = function (data,dataReadyFn) {
    this(data,function(err,m) {
        dataReadyFn(err,m);
    })
}

/**
 * 将原始数据对象数据转换为Resource对象数据
 * @param datas
 * @param dataReadyFn
 */
proto.toResources = function(datas,dataReadyFn) {
    var self = this;
    var index = -1;
    var ms = [];
    var toModel = function () {
        index++;
        var defered = Q.defer();
        self.toResource(datas[index],function(err,m) {
            if (err) {
                defered.reject(err);
                dataReadyFn(err,undefined);
            } else {
                ms.push(m);
                defered.resolve();
            }
        });
        return defered.promise;
    }
    var fns = marsUtil.Common.createMethodArray(toModel,datas.length);
    fns.push(function() {
        dataReadyFn(null,ms);
    });
    fns.reduce(function(prev,current) {
        return prev.then(current);
    },Q());
}

proto.setupProxy = function (proxy) {
    if (!proxy) {
        throw new Error(this.modelName + ',无效的代理对象');
    }
    this._proxy = proxy;
}

/**
 * 检验model配置的model
 */
var configModel = function(options) {
    var model = function() {
    }
    model.__proto__ = proto;
    model._options = options;
    return model;
}({
    fields: [
        {   name: "fields",
            type: "array",
            required:true,
            model:{fields:[
                {name:'name',type:'string',required:true},
                {name:'type',type:'string',required:true},
                {name:'convert',type:'string'},
                {name:'label',type:'string'}
            ]}},
        {   name: "proxy",
            type: "object",
            model:{fields:[
                {name:'type',type:'string',required:true},
                {name:'action',type:'string',required:true},,
                {name:'params',type:'object'},
            ]}},
        {
            name: "methods",
            type: "object"
        }
    ]
});
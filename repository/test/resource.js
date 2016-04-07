/*!
 * mars
 * Copyright(c) 2015 huangbinglong
 * MIT Licensed
 */

'use strict';
var rep = require("../lib");
var repository = rep.Repository();
var Model = rep.Model;
var should = require('should');
var service = require("zwx-mars-service");
var proxy = service.Proxy();

describe('Resource', function () {
    before(function () {
        /**=====在所有测试之前，初始化数据*/
        // 注册model
        var model = Model({
            name: 'WorkorderAnalysisUser',
            fields: [
                {name: "page", type: "string", required: true},
                {name: "userid", type: "string", required: true},
                {name: "allNums", type: "number"},
                {name: "completeNums", type: "number"},
                {name: "inserviceNums", type: "number"},
                {name: "waitNums", type: "number"},
                {name: "comleterate", type: "number"},
                {name: "laterate", type: "number"}
            ],
            proxy: {
                type: "Y9",
                action: "com.yun9.ws.biz.service.QueryWorkorderAnalysisUserService",
                params: {
                    instid: "10000001468002"
                }
            }
        });
        repository.model(model);
        // 注册proxy
        proxy.use("Y9", service.ProxyY9({
            token: "8fc50dd14a951318ca168e40a9fa1ec78d1110e058700c9affdbe6ab5eb6b931",
            baseurl: "http://120.24.84.201:10080/ws-biz/service/action.yun9",
            header: {}
        }));
    });

    it('verify Model', function () {
        var model = repository.get('WorkorderAnalysisUser');
        should(model).ok;
        should(typeof model).eql('function');
    });

    it('verify resource with static data', function (done) {
        var model = repository.get('WorkorderAnalysisUser');
        model({
            data: {
                "page": null,
                "userid": null,
                "allNums": 6845,
                "completeNums": 0,
                "inserviceNums": 0,
                "waitNums": 6845,
                "comleterate": 0,
                "laterate": 1
            }
        }, function (err, resource) {
            should(err).not.ok;
            should(resource).ok;
            should(resource).have.property('getBean');
            should(resource.getBean(0)).have.property('allNums', 6845);
            done();
        });
    });

    it('verify proxy', function () {
        var strategy = proxy._strategy('Y9');
        should(strategy).ok;
        should(strategy).have.property('_token',
            '8fc50dd14a951318ca168e40a9fa1ec78d1110e058700c9affdbe6ab5eb6b931');
    });

    it('resource find', function (done) {
        var model = repository.get('WorkorderAnalysisUser');
        model.action(proxy,
            {
                beginDate: '1420041600000',
                endDate: '1451577600000'
            },
            function (err, resource) {
                should(err).not.ok;
                should(resource).ok;
                should(resource.getBean(0)).ok;
                should(resource.get('allNums')).not.empty;
                var json = resource.toJSON();
                should(json).have.property('header');
                should(json).have.property('rows');
                should(json).have.property('caches');
                done();
            });
    });
});
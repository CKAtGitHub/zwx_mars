/**
 * Created by leon on 16/2/19.
 */

var request = require("superagent");
var should = require("should");

describe("InvokActivitiRest", function () {

    it("invoked", function () {
        request.post("http://www.yun9.com:8080/bb8-rest/service/bb8/repository/bb8-audit-action",{
            "auditDefId": "2",
            "label": "反对",
            "procdefId": "AxFightTask:1:3167497d-d6e7-11e5-89dc-8adafc82f0fa",
            "actId": "startevent1"
        })
            .query({})
            .auth('kermit', 'kermit')
            .end(function (err,res) {
                res.should.not.be.NaN;
            });
    });

    it("zwx_test", function () {
        request.post("http://127.0.0.1:8080/zwxadmin/goods/json/queryCate")
            .auth('zwx_user', '1y$CZna5')
            .send({
                "token" : "8fc50dd14a951318ca168e40a9fa1ec78d1110e058700c9affdbe6ab5eb6b931",
                "data":{"cityId":10001}
            })
            .end(function (err,res) {
                res.should.not.be.NaN;
            });
    });

    it("supertest", function (done) {

        request.post("http://120.24.84.201:10080/ws-biz/service/action.yun9")
            .set('Content-Type', 'application/json;charset=UTF-8')
            .send({
                "action": "com.yun9.ws.biz.service.QueryProductInfoByIdService",
                "token": "8fc50dd14a951318ca168e40a9fa1ec78d1110e058700c9affdbe6ab5eb6b931",
                "data": {
                    "productid": "10000001447014"
                }
            }).end(function (err, res) {
                done();
            })
    })
});
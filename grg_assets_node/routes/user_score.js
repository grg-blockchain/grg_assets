/****
 * 该模块的接口针对代理节点开放的接口
 * @type {createApplication}
 */

var express = require('express');
var router = express.Router();

var mysql = require('../common/mysql');
var result = require('../common/result')();
var logger = require('../common/log')("user_account");
var async = require('async');
var utils = require('../common/utils');
var score = require('../daos/score');
var sp = require('../daos/sp');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/query_sp_score_list', function (req, res, next) {
    let result_data = [];
    async.waterfall([
            function (callback) {
                score.queryUserSpList(req.session.mobile, utils.getDatetime(), function (err, data) {
                    if (err) {
                        return callback(err, null);
                    }
                    result_data = data;
                    return callback(null, data);
                })
            }],
        function (err, data) {
            if (err) {
                logger.error(err);
                return res.send(result.Result({}, err));
            }
            return res.send(result.Result(result.makePage(result_data, 1)));
        }
    );
});

router.post('/query_sp_score_config', function (req, res, next) {
    if (req.body.sp_id === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    let result_data = {};
    async.waterfall([
        function (callback) {
            score.queryUserSpScoreStatus(req.session.mobile, req.body.sp_id, utils.getDatetime(), function (err, data) {
                if (err) {
                    return callback(err, null);
                }
                result_data = data;
                return callback(null, data);
            })
        }],
        function (err, data) {
            if (err) {
                logger.error(err);
                return res.send(result.Result({}, err));
            }
            return res.send(result.Result(result_data));
        }
    );
});

module.exports = router;

var express = require('express');
var router = express.Router();

var mysql = require('../common/mysql');
var result = require('../common/result')();
var logger = require('../common/log')("user_account");
var async = require('async');
var utils = require('../common/utils');
var assets = require('../daos/assets');
const Joi = require("joi");

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/query_assets_list', function (req, res, next) {
    let schema = {
        assets_type: Joi.string().default(""),
        sp_id: Joi.string().default(""),
        assets_id: Joi.string().default(""),
        page: Joi.string().default(0),
        count: Joi.string().default(20),
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    req.body = value.value;
    let result_data = [];
    async.waterfall([
            function (callback) {
                assets.queryAssetsList(utils.getDatetime(), req.session.mobile, req.body.assets_type, req.body.sp_id, req.body.assets_id
                , req.body.page, req.body.count, function (err, data) {
                    if (err) {
                        return callback(err, null);
                    }
                    result_data = data;
                    return callback(null, data);
                })
            }], function (err, data) {
            if (err) {
                logger.error(err);
                return res.send(result.Result({}, err));
            }
            return res.send(result.Result(result_data));
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
            assets.queryUserSpScoreStatus(req.session.mobile, req.body.sp_id, utils.getDatetime(), function (err, data) {
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

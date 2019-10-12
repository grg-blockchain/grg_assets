/****
 * 该模块的接口针对中心节点的代理节点（部署在运营方的服务器上的代理节点）开放的接口
 * @type {createApplication}
 */

var express = require('express');
var router = express.Router();
var result = require('../common/result')();
var logger = require('../common/log')("user_account");
var async = require('async');
var utils = require('../common/utils');
let mysql = require('../common/mysql');
let redis = require('../common/redis');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/login', function (req, res, next) {
    if (utils.checkEmpty(req.body.mobile) || utils.checkEmpty(req.body.login_password)) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }

    let sql_str = "select * from t_node_user_info where mobile = ?";
    let params = [req.body.mobile];
    mysql.query(sql_str, params, function (err, data) {
        if (err) {
            logger.error(err);
            return res.send(result.Result({}, result.err_code.ERR_DB_ERROR));
        }

        if (data.length === 0) {
            return res.send(result.Result({}, result.err_code.ERR_USER_NOT_EXIST));
        }

        let user_info = data[0];
        if (req.body.login_password != user_info.login_password) {
            return res.send(result.Result({}, result.err_code.ERR_LOGIN_PASSWORD_ERROR));
        }

        let key = utils.randomString(16);
        let iv = utils.randomString(16);

        // key = new Buffer(key).toString("base64");
        // iv = new Buffer(iv).toString("base64");

        key = Buffer.from(key).toString("base64");
        iv = Buffer.from(iv).toString("base64");

        req.session.regenerate(function (error) {
            if (error) {
                return res.send(result.Result({}, result.err_code.ERR_SESSION_SERVER_ERROR));
            }
            req.session.key = key;
            req.session.iv = iv;
            redis.set("user_aeskey_" + req.body.mobile, key + "_" + iv, function (err, data) {
                if (err) {
                    return callback(result.Result(result.err_code.ERR_REDIS_SET_FAILED));
                }
                return res.send(result.Result({session_id: req.session.id, key: key, iv: iv}));
            });
        });
    });

});

router.post('/set_pay_password', function(req, res, next) {
    let schema = {
        pay_password: Joi.string().required(),
        query_time: Joi.string().required(),
        signature: Joi.string().required(),
    };
    let err = Joi.validate(req.body, schema);
    if (err.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, err.error.message));
    }

    let data = "" + req.body.pay_password + req.body.query_time;
    if (!utils.checkSignature(data, req.session.key, req.session.iv, req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_SIGNATURE_ERROR));
    }

    req.body.pay_password = req.body.pay_password + "1234567890";
    req.body.pay_password = utils.sign(req.body.pay_password);

    let datetime = utils.getDatetime();
    async.waterfall([
        function (callback) {
            let sql_str = "update t_node_user_account set pay_password = ?, update_time = ? where mobile = ?";
            let params = [req.body.pay_password, datetime, req.session.mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(err);
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result());
    });
});

router.post('/logout', function(req, res, next) {
    req.session.destroy(function() {});
    return res.send(result.Result({}));
});

module.exports = router;

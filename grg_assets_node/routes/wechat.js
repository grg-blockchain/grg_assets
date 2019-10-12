var express = require('express');
var router = express.Router();

var result = require('../common/result')();
var logger = require('../common/log')("wxaccount");
var async = require('async');
var config = require('../config');
let httpclient = require('../common/httpclient');
let mysql = require('../common/mysql');
let wechat = require('../daos/wechat');
var result = require('../common/result')();
var utils = require('../common/utils');
let redis = require('../common/redis');
const Joi = require("joi");
// require("joi-router")

/* GET users listing. */
router.get('/', function (req, res, next) {
    // res.send('respond with a resource');
});


router.post('/test_login',function(req,res,next){
    var str = wechat.test_func2();
    res.send(str);
    // req.session.regenerate(function (error) {
    //     if (error) {
    //         return res.send(result.Result({}, result.err_code.ERR_SESSION_SERVER_ERROR));
    //     }
    //     req.session.zk = "12345";
    //     return res.send(result.Result({session_id: req.session.id}));
    // });
});


router.post('/test_query', function(req,res,next){
    let schema = {
        zk1: Joi.string().required(),
        zk2: Joi.string().required(),
        zk3: Joi.string().required(),
    };
    let err = Joi.validate(req.body, schema);
    if (err.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, err.error.message));
    }
    return res.send(result.Result({info: "ok"}));
});

//用户登录
router.post('/login',function(req,res,next){
    let schema = {
        code: Joi.string().required(),
    };
    let err = Joi.validate(req.body, schema);
    if (err.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, err.error.message));
    }

    if( req.body.code == undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    let result_data;
    let wechat_session = null;
    logger.info("wxlogin: accept request",req.body.code);
    async.waterfall([
        function(callback) {

            let appId = config.third_account.wechat.app_id;
            let secret = config.third_account.wechat.secret;
            let js_code = req.body.code;
            let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code` ;

            httpclient.doGet(url, function (err, data) {
                if(err){
                    logger.error("query veixin to get user oppenid failed: " + err)
                    return callback(err, err.message);
                }
                logger.info("query veixin to get user oppenid success: " + data);

                data = JSON.parse(data);
                if (data.errcode !== undefined && data.errcode !== 0){
                    return callback(result.err_code.ERR_WECHAT_ERR_CODE, data.errmsg);
                }

                wechat_session = data;
                callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_user_openid_info (type, openid, session_key, mobile, info) values (?, ?, ?, ?, ?) " +
                "on duplicate key update session_key = ?; ";
            let params = [1, wechat_session.openid, wechat_session.session_key, '', '', wechat_session.session_key];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(err);
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                let key = utils.randomString(16);
                let iv = utils.randomString(16);

                // key = new Buffer(key).toString("base64");
                // iv = new Buffer(iv).toString("base64");

                key = Buffer.from(key).toString("base64");
                iv = Buffer.from(iv).toString("base64");

                req.session.regenerate(function (err) {
                    if (err) {
                        logger.error(err);
                        return res.send(result.Result({}, result.err_code.ERR_SESSION_SERVER_ERROR));
                    }
                    req.session.wechat_session = wechat_session;
                    req.session.key = key;
                    req.session.iv = iv;
                    result_data = {session_id: req.session.id, key: key, iv: iv};
                    return callback(null, null);
                });
            });
        },
        function (data, callback) {
            // 检测是否有支付密码，以及拿到手机号。
            let sql_str = "select t_node_user_account.* " +
                "from t_node_user_openid_info left join t_node_user_account " +
                "on t_node_user_openid_info.mobile = t_node_user_account.mobile " +
                "where t_node_user_openid_info.type = ? and t_node_user_openid_info.openid = ? and t_node_user_openid_info.mobile != ''";
            let params = [1, wechat_session.openid];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(err);
                    return callback(result.err_code.ERR_DB_ERROR);
                }

                result_data.need_set_pay_password = (data.length === 0 || data[0].pay_password === "")? 1: 0;
                result_data.need_set_mobile = (data.length === 0 || data[0].mobile === "")? 1: 0;

                return callback(null, null);
            });
        }
    ],function(err, data){
        if(err){
            logger.error(err, data);
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(result_data));
    });

});

router.post('/register_info',function(req, res, next){
    let schema = {
        encrypted_data: Joi.string().required(),
        iv: Joi.string().required(),
    };
    let err = Joi.validate(req.body, schema);
    if (err.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, err.error.message));
    }

    let datetime = utils.getDatetime();
    let wechat_info = null;
    let mysql_connection = null;

    async.waterfall([
        function(callback) {
            wechat.decryptData(req.session.wechat_session.openid, req.body.encrypted_data, req.body.iv, function (err, data) {
                if (err) {
                    return callback(err);
                }
                wechat_info = data;
                return callback(null, data);
            })
        },
        function (data, callback) {
            mysql.getConnection(function (error, connection) {
                if(error) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                mysql_connection = connection;
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql_connection.beginTransaction(function (error) {
                if (error) {
                    logger.error("start transaction failed.");
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "update t_node_user_openid_info set info = ? , mobile = ? where openid = ? and type = ?";
            let params = [JSON.stringify(wechat_info), wechat_info.phoneNumber, req.session.wechat_session.openid, 1];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                req.session.wechat_info = wechat_info;
                req.session.mobile = wechat_info.phoneNumber;

                let key = req.session.key;
                let iv = req.session.iv;
                redis.set("user_aeskey_" + wechat_info.phoneNumber, key + "_" + iv, function (err, data) {
                    if (err) {
                        return callback(result.err_code.ERR_REDIS_SET_FAILED);
                    }
                    return callback(null, {wechat_info: wechat_info});
                });

            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_user_account (mobile, nick, create_time, update_time) value (?, ?, ?, ?)";
            let params = [wechat_info.phoneNumber, wechat_info.phoneNumber, datetime, datetime];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err && err.code === "ER_DUP_ENTRY") {
                    return callback(null, null);
                }
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        }
    ],function(err, data){
        if(err){
            logger.error(err);
            mysql.transFailed(mysql_connection);
            return res.send(result.Result({}, err));
        }
        mysql.transSuccess(mysql_connection);
        return res.send(result.Result({wechat_info: wechat_info}));
    });

});

router.post('/register_info_test',function(req, res, next){
    if (req.body.mobile == null && req.body.login_password) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }

        if (req.body.mobile != "13699999999" &&  req.body.login_password != "12345678") {
        return res.send(result.Result({}, result.err_code.ERR_LOGIN_PASSWORD_ERROR));
    }

    let datetime = utils.getDatetime();
    let wechat_info = null;
    let mysql_connection = null;

    let mobile = "13699999999";
    async.waterfall([
        function(callback) {
            mysql.getConnection(function (error, connection) {
                if(error) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                mysql_connection = connection;
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql_connection.beginTransaction(function (error) {
                if (error) {
                    logger.error("start transaction failed.");
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "update t_node_user_openid_info set info = ? , mobile = ? where openid = ? and type = ?";
            let params = [JSON.stringify({}), mobile, req.session.wechat_session.openid, 1];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                req.session.wechat_info = {};
                req.session.mobile = mobile;
                return callback(null, {wechat_info: {}});
            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_user_account (mobile, nick, create_time, update_time) value (?, ?, ?, ?)";
            let params = [mobile, mobile, datetime, datetime];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err && err.code === "ER_DUP_ENTRY") {
                    return callback(null, null);
                }
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        }
    ],function(err, data){
        if(err){
            logger.error(err);
            mysql.transFailed(mysql_connection);
            return res.send(result.Result({}, err));
        }
        mysql.transSuccess(mysql_connection);
        return res.send(result.Result({wechat_info: wechat_info}));
    });

});


module.exports = router;
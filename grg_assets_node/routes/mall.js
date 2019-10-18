let express = require('express');
let router = express.Router();

let result = require('../common/result')();
let logger = require('../common/log')("wxaccount");
let async = require('async');
let config = require('../config');
let mysql = require('../common/mysql');
let utils = require('../common/utils');
let redis = require('../common/redis');
const Joi = require("joi");
// require("joi-router")

router.post('/index',function(req,res,next){
    return res.send(result.Result({
        banners: [
            {
                img_url: "images/f1.jpg",
                query_url: "",
                desc: "星际穿越",
            },
            {
                img_url: "images/f2.jpg",
                query_url: "",
                desc: "星球大战-原力觉醒",
            },
            {
                img_url: "images/f3.jpg",
                query_url: "",
                desc: "流浪地球",
            },
            {
                img_url: "images/f4.jpg",
                query_url: "",
                desc: "霍比特人",
            },
        ],
        new_assets: [
            {
                img_url: "images/f1.jpg",
                query_url: "",
                desc: "星际穿越",
            },
            {
                img_url: "images/f2.jpg",
                query_url: "",
                desc: "星球大战-原力觉醒",
            },
            {
                img_url: "images/f3.jpg",
                query_url: "",
                desc: "流浪地球",
            },
            {
                img_url: "images/f4.jpg",
                query_url: "",
                desc: "霍比特人",
            },
        ],
        hot_assets: [
            {
                img_url: "images/f1.jpg",
                query_url: "",
                desc: "星际穿越",
            },
            {
                img_url: "images/f2.jpg",
                query_url: "",
                desc: "星球大战-原力觉醒",
            },
            {
                img_url: "images/f3.jpg",
                query_url: "",
                desc: "流浪地球",
            },
            {
                img_url: "images/f4.jpg",
                query_url: "",
                desc: "霍比特人",
            },
        ],
    }));
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
var express = require('express');
var router = express.Router();

var mysql = require('../common/mysql');
var result = require('../common/result')();
var logger = require('../common/log')("user_account");
var async = require('async');
var utils = require('../common/utils');
var score = require('../daos/score');
var trans = require('../daos/trans');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/pay', function (req, res, next) {
    if (req.body.payer_sp_id === undefined || req.body.payee_sp_id === undefined ||
        req.body.score === undefined || req.body.pay_password === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    if (req.body.score < 0) {
        return res.send(result.Result({}, result.err_code.ERR_SCORE_INVALID));
    }

    req.body.extern_info = req.body.extern_info || "";
    let data = "" + req.body.payer_sp_id + req.body.score + req.body.payee_sp_id +
        req.body.extern_info + req.body.pay_password + req.body.query_time;
    if (!utils.checkSignature(data, req.session.key, req.session.iv, req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_SIGNATURE_ERROR));
    }

    async.waterfall([
        function (callback) {
            let sql_str = "select id, pay_password from t_node_user_account where mobile = ?";
            let params = [req.session.mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length === 0) {
                    return callback(result.err_code.ERR_USER_NOT_EXIST);
                }
                let pay_password = data[0].pay_password;
                req.body.pay_password = req.body.pay_password + "1234567890";
                req.body.pay_password = utils.sign(req.body.pay_password);
                if (req.body.pay_password != pay_password) {
                    return callback(result.err_code.ERR_PAY_PASSWORD_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            trans.userPayToSp(req.session.mobile, "0", req.body.score, req.body.payee_sp_id, 4, req.body.extern_info, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(data));
    });
});

router.post('/transfer', function (req, res, next) {
    if (req.body.score === undefined || req.body.payee_user_mobile === undefined || req.body.pay_password === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    if (req.body.score < 0) {
        return res.send(result.Result({}, result.err_code.ERR_SCORE_INVALID));
    }
    req.body.payer_sp_id = req.body.payer_sp_id == undefined ? "" : req.body.payer_sp_id;
    req.body.extern_info = req.body.extern_info == undefined ? "" : req.body.extern_info;

    let data = "" + req.body.payer_sp_id + req.body.score + req.body.payee_user_mobile +
        req.body.extern_info + req.body.pay_password + req.body.query_time;
    if (!utils.checkSignature(data, req.session.key, req.session.iv, req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_SIGNATURE_ERROR));
    }

    req.body.payer_sp_id = req.body.payer_sp_id == "" ? "0" : req.body.payer_sp_id;

    async.waterfall([
        function (callback) {
            let sql_str = "select id, pay_password from t_node_user_account where mobile = ?";
            let params = [req.session.mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length === 0) {
                    return callback(result.err_code.ERR_USER_NOT_EXIST);
                }
                let pay_password = data[0].pay_password;
                req.body.pay_password = req.body.pay_password + "1234567890";
                req.body.pay_password = utils.sign(req.body.pay_password);
                if (req.body.pay_password != pay_password) {
                    return callback(result.err_code.ERR_PAY_PASSWORD_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            trans.userPayToUser(req.session.mobile, req.body.payer_sp_id, req.body.score, req.body.payee_user_mobile, 5, req.body.extern_info, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(data));
    });
});


router.post('/convert', function (req, res, next) {
    if (req.body.payer_sp_id === undefined || req.body.score === undefined ||
        req.body.pay_password === undefined || req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    if (req.body.score < 0) {
        return res.send(result.Result({}, result.err_code.ERR_SCORE_INVALID));
    }

    let data = "" + req.body.payer_sp_id + req.body.score + req.body.pay_password + req.body.query_time;
    if (!utils.checkSignature(data, req.session.key, req.session.iv, req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_SIGNATURE_ERROR));
    }

    let now_time = utils.getDatetime();
    let mysql_connection = null;
    let balance_list = [];
    let update_zero_score_id = [];
    let grg_score_config = null;
    let converted_grg_score = req.body.score;
    let converted_fee_sp_score = 0;
    let consume_sp_score = 0;
    async.waterfall([
        function (callback) {
            let sql_str = "select id, pay_password from t_node_user_account where mobile = ?";
            let params = [req.session.mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length === 0) {
                    return callback(result.err_code.ERR_USER_NOT_EXIST);
                }
                let pay_password = data[0].pay_password;
                req.body.pay_password = req.body.pay_password + "1234567890";
                req.body.pay_password = utils.sign(req.body.pay_password);
                if (req.body.pay_password != pay_password) {
                    return callback(result.err_code.ERR_PAY_PASSWORD_ERROR);
                }
                return callback(null, null);
            });
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
            let sql_str = "select score_expiration, convert_ratio, convert_fee, score_name from t_sp_score_config where sp_id = ?";
            let params = [req.body.payer_sp_id];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length === 0) {
                    return callback(result.err_code.ERR_NOT_DO_BUSINESS);
                }
                grg_score_config = data[0];

                if (grg_score_config.convert_ratio === 0) {
                    return callback(result.err_code.ERR_SP_SCORE_CONFIG_CONVERT_0);
                }
                consume_sp_score = req.body.score * grg_score_config.convert_ratio / 100;
                consume_sp_score = parseInt(consume_sp_score);
                logger.info("consume sp score: " + consume_sp_score);

                converted_fee_sp_score = parseInt(req.body.score * grg_score_config.convert_fee / 100);
                logger.info("converted fee: " + converted_fee_sp_score);

                consume_sp_score += converted_fee_sp_score;
                logger.info("consume sp score with fee: " + consume_sp_score);

                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "select id, score from t_node_user_balance where expire_time >= ? and mobile = ? and sp_id = ?";
            let params = [now_time, req.session.mobile, req.body.payer_sp_id];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length === 0) {
                    return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
                }

                balance_list = data;
                return callback(null, null);
            });
        },
        function (data, callback) {
            let need_score = consume_sp_score;

            let update_score_id = null;
            let update_score = 0;

            for (let index in balance_list) {
                logger.info("iterate balance_list index:" + index + ": " + JSON.stringify(balance_list[index]));
                if (balance_list[index].score >= need_score) {
                    update_score_id = balance_list[index].id;
                    update_score = balance_list[index].score - need_score;
                    need_score = 0;
                    logger.info("update_score_id: " + update_score_id + ", update_score:" + update_score);
                    break;
                }
                else {
                    need_score -= balance_list[index].score;
                    update_zero_score_id.push(balance_list[index].id);
                    logger.info("new need update zero score id: " + balance_list[index].id);
                }
            }
            logger.info("update_zero_score_id:" + JSON.stringify(update_zero_score_id));

            if (need_score > 0) {
                return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
            }

            let sql_str = "update t_node_user_balance set score = ? where id = ?";
            let params = [update_score, update_score_id];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            if (update_zero_score_id.length === 0) {
                return callback(null, null);
            }

            let params = "'" + update_zero_score_id.join("', '") + "'";
            let sql_str = "update t_node_user_balance set score = ? where id in (";
            sql_str += params;
            sql_str += ");";

            mysql_connection.query(sql_str, [0], function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });

        },
        function (data, callback) {
            let sql_str = "insert into t_node_score_trans (payer_user_mobile, payer_sp_id, payee_user_mobile, payee_sp_id, score, fee, type, extern_info, create_time, update_time)" +
                "value (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
            let params = [req.session.mobile, req.body.payer_sp_id, req.session.mobile, 0, converted_grg_score, converted_fee_sp_score, 2, consume_sp_score, now_time, now_time];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },

        function (data, callback) {
            let expire_datetime = utils.getFloorUpMonthDatetimeAfter(grg_score_config.score_expiration);
            let sql_str = "insert into t_node_user_balance (mobile, sp_id, score, expire_time, create_time, update_time) " +
                "value (?, ?, ?, ?, ?, ?) " +
                "on duplicate key update score = score + ?, update_time = ?";
            let params = [req.session.mobile, 0, parseInt(converted_grg_score), expire_datetime, now_time, now_time,
                parseInt(converted_grg_score), now_time];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        }

    ], function (err, data) {
        if (err) {
            logger.error(err);
            mysql.transFailed(mysql_connection);
            return res.send(result.Result({}, err, data));
        }
        mysql.transSuccess(mysql_connection);
        return res.send(result.Result({fee: converted_fee_sp_score}));
    });

});

router.post('/query_list', function (req, res, next) {
    var from_time = req.body.from_time || utils.getTimeByDays(-96);
    var to_time = req.body.to_time || utils.getTimeByDays(0);
    var order_by_desc = req.body.order_by_desc || "true";
    var sp_id = req.body.sp_id || "";
    var type = req.body.type || "";
    var state = req.body.state || "";
    var page = req.body.page || 0;
    var count = req.body.count || 10000;
    trans.queryList(from_time, to_time, req.session.mobile, sp_id, type, state, order_by_desc, page, count, function (error, data) {
        if (error) {
            return res.send(result.Result({}, error));
        }
        // for (var index in data.list) {
        //     if (data.list[index].payer_user_mobile === req.session.mobile) {
        //         data.list[index].score = "-" + data.list[index].score;
        //     }
        // }
        let trans_list = data.list;
        for (var index in trans_list) {
            if (trans_list[index].type == 1) {
                trans_list[index].score = "+" + trans_list[index].score + trans_list[index].payer_sp_score_name;
            }
            else if (trans_list[index].type == 2) {
                trans_list[index].score = "+" + trans_list[index].score + trans_list[index].payee_sp_score_name;
                // trans_list[index].extern_info = "-" + trans_list[index].extern_info + trans_list[index].payer_sp_score_name;
                trans_list[index].extern_info = "";
            }
            else if (trans_list[index].type == 3) {
                trans_list[index].score = "-" + trans_list[index].score + trans_list[index].payer_sp_score_name;
            }
            else if (trans_list[index].type == 4) {
                trans_list[index].score = "-" + trans_list[index].score + trans_list[index].payer_sp_score_name;
            }
            else if (trans_list[index].type == 5) {
                if (req.session.mobile == trans_list[index].payer_user_mobile) {
                    // 转账方
                    trans_list[index].score = "-" + trans_list[index].score + trans_list[index].payer_sp_score_name;
                }
                else if (req.session.mobile == trans_list[index].payee_user_mobile) {
                    // 转账目标用户
                    trans_list[index].score = "+" + trans_list[index].score + trans_list[index].payer_sp_score_name;
                }
            }
        }
        return res.send(result.Result(data));
    });
});

router.post('/stats', function (req, res, next) {
    var from_time = req.body.from_time || utils.getTimeByDays(-96);
    var to_time = req.body.to_time || utils.getTimeByDays(0);
    var sp_id = req.body.sp_id || "";
    var type = req.body.type || "";
    trans.grgScoreStats(from_time, to_time, req.session.mobile, sp_id, type, function (err, data) {
        if (err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result(data));
    });
});

module.exports = router;

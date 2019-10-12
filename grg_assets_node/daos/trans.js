var mysql = require('../common/mysql');
var logger = require('../common/log')("user_account");
var async = require('async');
var result = require('../common/result')();
var utils = require('../common/utils');

exports.queryList = function (from_time, to_time, user_mobile, sp_id, type, state, order_by_desc, page, count, callback) {
    var trans_list = [];
    var sp_list = [];
    var sp_info_map = {};
    async.waterfall([
        function (callback) {
            var sqlStr = "select * from t_node_score_trans where true ";
            var params = [];
            if (from_time !== "") {
                sqlStr += " and create_time >= ? ";
                params.push(from_time);
            }
            if (to_time != "") {
                sqlStr += " and create_time < ? ";
                params.push(to_time);
            }
            if (user_mobile !== "") {
                sqlStr += " and (payer_user_mobile = ? or payee_user_mobile = ?) ";
                params.push(user_mobile);
                params.push(user_mobile);
            }

            if (sp_id !== "") {
                sqlStr += " and (payer_sp_id = ? or payee_sp_id = ?) ";
                params.push(sp_id);
                params.push(sp_id);
            }

            if (type !== "") {
                sqlStr += " and type = ? ";
                params.push(type);
            }

            if (state !== "") {
                sqlStr += " and state = ?";
                params.push(state);
            }

            if (order_by_desc === "true") {
                sqlStr += " order by create_time desc";
            }

            sqlStr += " limit ?,?";
            params.push(page * count);
            params.push(parseInt(count));

            mysql.query(sqlStr, params, function (error, data) {
                if (error) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }

                trans_list = data;
                // if (trans_list.length === 0) {
                //     return callback(result.err_code.ERR_NO_TRANS_EXIST);
                // }
                return callback(null, data);
            });
        },
        function (data, callback) {
            var query_sp = {};
            for (var index in trans_list) {
                if (trans_list[index].payer_sp_id != "") {
                    query_sp[trans_list[index].payer_sp_id] = '';
                }
                if (trans_list[index].payee_sp_id != "") {
                    query_sp[trans_list[index].payee_sp_id] = '';
                }
            }
            query_sp = Object.keys(query_sp);
            query_sp = "'" + query_sp.join("', '") + "'";
            var sqlStr = "select t_sp_score_config.*, t_sp_info.simple_name " +
                "from t_sp_score_config left join t_sp_info " +
                "on t_sp_score_config.sp_id = t_sp_info.sp_id " +
                "where t_sp_score_config.sp_id in (";
            sqlStr += query_sp;
            sqlStr += ");";
            mysql.query(sqlStr, [], function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }

                sp_list = data;
                for (var index in sp_list) {
                    sp_info_map[sp_list[index].sp_id] = sp_list[index];
                }

                for (var index in trans_list) {
                    trans_list[index].payer_sp_simple_name = "";
                    trans_list[index].payer_sp_score_name = "";
                    trans_list[index].payer_sp_score_icon_image_url = "";
                    trans_list[index].payer_sp_convert_ratio = "";

                    trans_list[index].payee_sp_simple_name = "";
                    trans_list[index].payee_sp_score_name = "";
                    trans_list[index].payee_sp_score_icon_image_url = "";
                    trans_list[index].payee_sp_convert_ratio = "";

                    let payer_sp_id = trans_list[index].payer_sp_id;
                    if (sp_info_map[payer_sp_id] !== undefined) {
                        trans_list[index].payer_sp_simple_name = sp_info_map[payer_sp_id].simple_name;
                        trans_list[index].payer_sp_score_name = sp_info_map[payer_sp_id].score_name;
                        trans_list[index].payer_sp_score_icon_image_url = sp_info_map[payer_sp_id].score_icon_image_url;
                        trans_list[index].payer_sp_convert_ratio = sp_info_map[payer_sp_id].convert_ratio;
                    }
                    let payee_sp_id = trans_list[index].payee_sp_id;
                    if (sp_info_map[payee_sp_id] !== undefined) {
                        trans_list[index].payee_sp_simple_name = sp_info_map[payee_sp_id].simple_name;
                        trans_list[index].payee_sp_score_name = sp_info_map[payee_sp_id].score_name;
                        trans_list[index].payee_sp_score_icon_image_url = sp_info_map[payee_sp_id].score_icon_image_url;
                        trans_list[index].payee_sp_convert_ratio = sp_info_map[payee_sp_id].convert_ratio;
                    }

                    // 商户发积分给用户。
                    if (trans_list[index].type === 1) {
                        trans_list[index].relate_sp_simple_name = trans_list[index].payer_sp_simple_name;
                        trans_list[index].relate_user_mobile = trans_list[index].payee_user_mobile;
                        // trans_list[index].score = "+" + trans_list[index].score;

                        trans_list[index].title = "【发放】来自" + trans_list[index].relate_sp_simple_name;// +
                            // "发给您" + trans_list[index].score + sp_info_map[payer_sp_id].score_name;
                    }
                    // 用户兑换积分。
                    else if (trans_list[index].type === 2) {
                        trans_list[index].relate_sp_simple_name = trans_list[index].payer_sp_simple_name;
                        trans_list[index].relate_user_mobile = trans_list[index].payer_user_mobile;
                        // trans_list[index].score = "+" + trans_list[index].score;

                        trans_list[index].title = "【兑换】用" + trans_list[index].payer_sp_simple_name + "的" +
                            trans_list[index].extern_info + sp_info_map[payer_sp_id].score_name +
                            "兑换"; //成" + trans_list[index].score + "运通利是";
                    }
                    // 商户代扣用户积分。
                    else if (trans_list[index].type === 3) {
                        trans_list[index].relate_sp_simple_name = trans_list[index].payee_sp_simple_name;
                        trans_list[index].relate_user_mobile = trans_list[index].payer_user_mobile;
                        // trans_list[index].score = "-" + trans_list[index].score;

                        trans_list[index].title = "【代扣】" + trans_list[index].payee_sp_simple_name + "代扣"; //" +
                            // trans_list[index].score + sp_info_map[payer_sp_id].score_name;
                    }
                    // 用户支付积分。
                    else if (trans_list[index].type === 4) {
                        trans_list[index].relate_sp_simple_name = trans_list[index].payee_sp_simple_name;
                        trans_list[index].relate_user_mobile = trans_list[index].payer_user_mobile;
                        // trans_list[index].score = "-" + trans_list[index].score;

                        trans_list[index].title = "【支付】向" + trans_list[index].payee_sp_simple_name + "支付"; // +
                            // trans_list[index].score + sp_info_map[payer_sp_id].score_name;
                    }
                    // 转账。
                    else if (trans_list[index].type === 5) {
                        trans_list[index].relate_sp_simple_name = trans_list[index].payer_sp_simple_name;
                        trans_list[index].relate_user_mobile = trans_list[index].payer_user_mobile;
                        // trans_list[index].score = "-" + trans_list[index].score;
                        if (user_mobile == trans_list[index].payer_user_mobile) {
                            // 转账方
                            trans_list[index].title = "【转账】向" + trans_list[index].payee_user_mobile + "转账"; // +
                                // trans_list[index].score + sp_info_map[payer_sp_id].score_name;
                        }
                        else if (user_mobile == trans_list[index].payee_user_mobile) {
                            // 转账目标用户
                            trans_list[index].title = "【转账】" + trans_list[index].payer_user_mobile + "向您转账"; // +
                                // trans_list[index].score + sp_info_map[payer_sp_id].score_name;
                        }

                    }
                    // trans_list[index].create_time = utils.getDateTimeByInputTime(trans_list[index].create_time);

                    delete trans_list[index].update_time;
                }
                return callback(null, data);
            });

        }
    ], function (err, data) {
        if (err) {
            return callback(err, null);
        }
        return callback(err, result.makePage(trans_list, page));
    });
};


exports.grgScoreStats = function (from_time, to_time, user_mobile, sp_id, type, callback) {
    let trans_list = [];
    let income = 0;
    let outcome = 0;
    async.waterfall([
        function (callback) {
            var sqlStr = "select * from t_node_score_trans where true ";
            var params = [];
            if (from_time !== "") {
                sqlStr += " and create_time >= ? ";
                params.push(from_time);
            }
            if (to_time !== "") {
                sqlStr += " and create_time < ? ";
                params.push(to_time);
            }
            if (user_mobile !== "") {
                sqlStr += " and (payer_user_mobile = ? or payee_user_mobile = ?) ";
                params.push(user_mobile);
                params.push(user_mobile);
            }

            if (sp_id !== "") {
                sqlStr += " and (payer_sp_id = ? or payee_sp_id = ?) ";
                params.push(sp_id);
                params.push(sp_id);
            }

            if (type !== "") {
                sqlStr += " and type = ? ";
                params.push(type);
            }

            sqlStr += " and state = ?";
            params.push(1);

            mysql.query(sqlStr, params, function (error, data) {
                if (error) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }

                trans_list = data;
                return callback(null, data);
            });
        },
        function (data, callback) {
            for (let index in trans_list) {
                if (trans_list[index].type == 1 && trans_list[index].payer_sp_id == "0") {
                    income += trans_list[index].score;
                }
                else if (trans_list[index].type == 2) {
                    income += trans_list[index].score;
                }
                else if (trans_list[index].type == 3 && trans_list[index].payer_sp_id == "0") {
                    outcome += trans_list[index].score;
                }
                else if (trans_list[index].type == 4 && trans_list[index].payer_sp_id == "0") {
                    outcome += trans_list[index].score;
                }
                else if (trans_list[index].type == 5 && trans_list[index].payer_sp_id == "0") {
                    if (user_mobile == trans_list[index].payer_user_mobile) {
                        outcome += trans_list[index].score
                    }
                    else if (user_mobile == trans_list[index].payee_user_mobile) {
                        income += trans_list[index].score
                    }
                }
            }

            income = "+" + income;
            outcome = "-" + outcome;
            return callback(null, null);
        }
    ], function (err, data) {
        if (err) {
            return callback(err, null);
        }
        return callback(err, {income: income, outcome: outcome});
    });
};

exports.userPayToSp = function (mobile, payer_sp_id, score, payee_sp_id, trans_type, extern_info, callback) {
    let mysql_connection = null;
    let now_time = utils.getDatetime();
    let balance_list = [];
    let update_zero_score_id = [];

    async.waterfall([
        function (callback) {
            mysql.getConnection(function (err, connection) {
                if(err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                mysql_connection = connection;
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql_connection.beginTransaction(function (err) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            deductUserScore(mysql_connection, now_time, mobile, payer_sp_id, score, callback);
        },
        function (data, callback) {
            let sql_str = "insert into t_node_score_trans (payer_user_mobile, payer_sp_id, payee_sp_id, score, type, extern_info, create_time, update_time)" +
                "value (?, ?, ?, ?, ?, ?, ?, ?);";
            let params = [mobile, payer_sp_id, payee_sp_id, score, trans_type, extern_info, now_time, now_time];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "";
            if (payer_sp_id == 0) {
                sql_str = "update t_node_sp_balance set grg_score = grg_score + ?, update_time = ? where sp_id = ?";
            }
            else {
                sql_str = "update t_node_sp_balance set score = score + ?, update_time = ? where sp_id = ?";
            }
            let params = [score, now_time, payee_sp_id];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        }
    ], function (err, data) {
        if (err) {
            mysql.transFailed(mysql_connection);
            logger.error(JSON.stringify(data));
            return callback(err);
        }
        mysql.transSuccess(mysql_connection);
        return callback(null, data);
    });
};

exports.userPayToUser = function (mobile, payer_sp_id, score, payee_user_mobile, trans_type, extern_info, next) {
    let mysql_connection = null;
    let now_time = utils.getDatetime();
    let release_list = [];
    async.waterfall([
        function (callback) {
            let sql_str = "select mobile, nick, state from t_node_user_account where mobile = ?;";
            let params = [payee_user_mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                if (data.length == 0) {
                    return callback(result.err_code.ERR_USER_NOT_EXIST);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql.getConnection(function (err, connection) {
                if(err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                mysql_connection = connection;
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql_connection.beginTransaction(function (err) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            deductUserScore(mysql_connection, now_time, mobile, payer_sp_id, score, function (err, data) {
                if (err) {
                    return callback(err);
                }
                release_list = data;
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_score_trans (payer_user_mobile, payer_sp_id, payee_user_mobile, score, type, extern_info, create_time, update_time)" +
                "value (?, ?, ?, ?, ?, ?, ?, ?);";
            let params = [mobile, payer_sp_id, payee_user_mobile, score, trans_type, extern_info, now_time, now_time];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            batchReleaseScoreToUser(mysql_connection, release_list, payee_user_mobile, now_time, callback);
        }
    ], function (err, data) {
        if (err) {
            mysql.transFailed(mysql_connection);
            logger.error(JSON.stringify(data));
            return next(err);
        }
        mysql.transSuccess(mysql_connection);
        return next(null, data);
    });
};

function batchReleaseScoreToUser(mysql_connection, release_list, mobile, now_time, next) {
    // release list contain ele: {sp_id: "xxx", score: xxx, expire_time: "xxx"}
    let index = 0;
    async.whilst(
        function () {
            return index < release_list.length;
        },
        function (callback) {
            let sql_str = "insert into t_node_user_balance (mobile, sp_id, score, expire_time, create_time, update_time) " +
                "value (?, ?, ?, ?, ?, ?) " +
                "on duplicate key update score = score + ?, update_time = ?";
            let params = [mobile, release_list[index].sp_id, release_list[index].score, release_list[index].expire_time, now_time, now_time,
                release_list[index].score, now_time];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                index += 1;
                return callback(null, null);
            });
        },
        function (err, data) {
            if (err) {
                logger.error(JSON.stringify(data));
                return next(err);
            }
            return next(null, data);
        }
    )
}

function deductUserScore(mysql_connection, now_time, mobile, payer_sp_id, score, next) {
    let balance_list = [];
    let update_zero_score_id = [];
    let deduct_list = [];

    async.waterfall([
        function (callback) {
            let sql_str = "select id, mobile, sp_id, score, expire_time from t_node_user_balance where expire_time >= ? and mobile = ? and sp_id = ? and score > 0 order by expire_time";
            let params = [now_time, mobile, payer_sp_id];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                if (data.length === 0) {
                    return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
                }

                balance_list = data;
                logger.info("user balance_list: " + JSON.stringify(balance_list));
                return callback(null, null);
            });
        },
        function (data, callback) {
            let need_score = score;

            let update_score_id = null;
            let update_score = 0;

            for (let index in balance_list) {
                logger.info("iterate balance_list index:" + index + ": " + JSON.stringify(balance_list[index]));
                if (balance_list[index].score >= need_score) {
                    update_score_id = balance_list[index].id;
                    update_score = balance_list[index].score - need_score;
                    logger.info("update_score_id: " + update_score_id + ", update_score:" + update_score);

                    let deduct = balance_list[index];
                    deduct.score = need_score;
                    deduct_list.push(deduct)

                    need_score = 0;
                    break;
                }
                else {
                    need_score -= balance_list[index].score;
                    update_zero_score_id.push(balance_list[index].id);
                    logger.info("new need update zero score id: " + balance_list[index].id);

                    deduct_list.push(balance_list[index])
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
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            if (update_zero_score_id.length == 0) {
                return callback(null, null);
            }

            let params = "'" + update_zero_score_id.join("', '") + "'";
            let sql_str = "update t_node_user_balance set score = 0 where id in (";
            sql_str += params;
            sql_str += ");";

            mysql_connection.query(sql_str, [], function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR, err);
                }
                return callback(null, null);
            });
        }
    ], function (err, data) {
        if (err) {
            if (data) {
                logger.error(JSON.stringify(data));
            }
            return next(err);
        }
        return next(null, deduct_list);
    });
}
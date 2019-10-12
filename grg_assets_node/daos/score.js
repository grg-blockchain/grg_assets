var mysql = require('../common/mysql');
var logger = require('../common/log')("user_account");
var async = require('async');
var result = require('../common/result')();
var utils = require('../common/utils');

let queryUserBalance = function (user_mobile, sp_id, callback) {
    let result_data = {};

    var sqlStr = "select * from t_node_user_balance where expire_time >= ? and mobile = ? and sp_id = ? and score > 0;";
    var params = [utils.getDatetime(), user_mobile, sp_id];
    mysql.query(sqlStr, params, function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err))
            return callback(result.err_code.ERR_DB_ERROR);
        }
        result_data.balance_list = data;
        result_data.balance = 0;
        for (let index in data) {
            result_data.balance += data[index].score;
        }
        return callback(null, result_data);
    });
};


let queryUserSpScoreStatus = function (user_mobile, sp_id, datetime, callback) {
    if (datetime === "" || datetime === null) {
        datetime = utils.getDatetime();
    }

    let result_data = {};
    async.waterfall([
        function (callback) {
            let sql_str = "select t_sp_score_config.*, t_sp_info.simple_name " +
                "from t_sp_score_config left join t_sp_info " +
                "on t_sp_score_config.sp_id = t_sp_info.sp_id " +
                "where t_sp_score_config.sp_id = ?";
            let params = [sp_id];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                result_data.sp_info = data[0];
                return callback(null, null);
            });
        },
        function (data, callback) {
            queryUserBalance(user_mobile, sp_id, function (err, data) {
                if (err) {
                    return callback(err);
                }
                result_data.balance_list = data.balance_list;
                result_data.balance = data.balance;
                return callback(null, result_data);
            });
        }
    ], function (err, data) {
        if (err) {
            return callback (err, null);
        }
        return callback(err, result_data);
    });
};



let queryUserSpList = function (user_mobile, datetime, callback) {
    let sql_str =
        "select result.*, t_sp_score_config.score_name, t_sp_score_config.score_icon_image_url from " +
            "(select t_node_user_balance.*, t_balance.balance from " +
                "(select sum(score) as balance, sp_id, mobile from t_node_user_balance where mobile = ? and expire_time > ? and sp_id != '0' and score > 0 group by sp_id) t_balance " +
                "left join (select min(expire_time) as min_expire_time,sp_id, mobile from t_node_user_balance where mobile = ? and expire_time > ? and sp_id != '0' and score > 0 group by sp_id) t_expire_time on t_balance.sp_id = t_expire_time.sp_id " +
                "left join t_node_user_balance on t_node_user_balance.sp_id = t_balance.sp_id and t_node_user_balance.expire_time = t_expire_time.min_expire_time and t_node_user_balance.mobile = t_expire_time.mobile" +
            ") result left join t_sp_score_config on result.sp_id = t_sp_score_config.sp_id;";
    let params = [user_mobile, datetime, user_mobile, datetime];

    mysql.query(sql_str, params, function (err, data) {
        if (err) {
            return callback(result.err_code.ERR_DB_ERROR);
        }
        return callback(null, data);
    });
};

module.exports = {
    queryUserBalance,
    queryUserSpScoreStatus,
    queryUserSpList
}
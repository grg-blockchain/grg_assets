var mysql = require('../common/mysql');
var logger = require('../common/log')("user_account");
var async = require('async');
var result = require('../common/result')();
var utils = require('../common/utils');

let queryAssetsList = function (expire_time, mobile, assets_type, sp_id, assets_id, page, count, callback) {
    let result_list = {};

    let sql_str = "select balance.* from t_node_user_balance as balance " +
        "left join t_sp_assets as assets " +
        "on balance.assets_id = assets.id and balance.assets_type = assets.type " +
        "where balance.expire_time >= ? ";
    let params = [utils.getDatetime()];

    if (mobile != "") {
        sql_str += "and balance.mobile = ? ";
        params.push(mobile);
    }
    if (assets_type != "") {
        sql_str += "and balance.assets_type = ? ";
        params.push(assets_type);
    }
    if (sp_id != "") {
        sql_str += "and balance.sp_id = ? ";
        params.push(sp_id);
    }
    if (assets_id != "") {
        sql_str += "and balance.assets_id = ? ";
        params.push(assets_id);
    }
    sql_str += "and balance.balance > 0 limit ?,?;";
    params.push(page*count);
    params.push(count);

    mysql.query(sql_str, params, function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err))
            return callback(result.err_code.ERR_DB_ERROR);
        }
        result_list.assets_list = data;
        return callback(null, result_list);
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
            queryList(user_mobile, sp_id, function (err, data) {
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
    queryAssetsList,
    queryUserSpScoreStatus,
    queryUserSpList
}
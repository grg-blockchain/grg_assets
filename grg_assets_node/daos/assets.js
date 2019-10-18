var mysql = require('../common/mysql');
var logger = require('../common/log')("user_account");
var async = require('async');
var result = require('../common/result')();
var utils = require('../common/utils');

let queryAssetsList = function (expire_time, mobile, type, sp_id, assets_id, page, count, callback) {
    let sql_str = "select * from t_node_user_assets where expire_time >= ? ";
    let params = [utils.getDatetime()];

    if (mobile != "") {
        sql_str += "and mobile = ? ";
        params.push(mobile);
    }
    if (type != "") {
        sql_str += "and type = ? ";
        params.push(type);
    }
    if (sp_id != "") {
        sql_str += "and sp_id = ? ";
        params.push(sp_id);
    }
    if (assets_id != "") {
        sql_str += "and assets_id = ? ";
        params.push(assets_id);
    }
    sql_str += "and balance > 0 limit ?,?;";
    params.push(page*count);
    params.push(count);

    mysql.query(sql_str, params, function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err))
            return callback(result.err_code.ERR_DB_ERROR);
        }
        return callback(null, data);
    });
};


let transferUserAsset = function (from_mobile, asset_id, to_mobile, callback) {
    async.waterfall([
        function (callback) {
            let sql_str = "select * from t_node_user_assets where id = ? and mobile = ? and balance > 0";
            let params = [asset_id, from_mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length == 0) {
                    return callback(result.err_code.ERR_ASSET_IS_NOT_BELONG_YOU);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "update t_node_user_assets set mobile = ? where id = ? and mobile = ? and balance > 0";
            let params = [to_mobile, asset_id, from_mobile];
            mysql.query(sql_str, params, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        }
    ], function (err, data) {
        if (err) {
            return callback (err, null);
        }
        return callback(err, "");
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
    transferUserAsset,
    queryUserSpList
}
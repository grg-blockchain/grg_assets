var mysql = require('../common/mysql');
var logger = require('../common/log')("user_account");
var async = require('async');
var result = require('../common/result')();
var utils = require('../common/utils');

exports.queryInfo = function (sp_id, callback) {
    var sql_str = "select * from t_sp_info where sp_id = ?";
    var params = [sp_id];
    mysql.query(sql_str, params, function (error, data) {
        if (error) {
            return callback(result.err_code.ERR_DB_ERROR);
        }

        if (!data instanceof Array) {
            logger.error("read the data from mysql but data is not a array");
            return callback(result.err_code.ERR_UNKNOWN);
        }

        if (data.length === 0) {
            return callback(result.err_code.ERR_SP_ID_NOT_EXIST);
        }

        let sp_info = data[0];
        data = sp_info.aes_key.split("_");
        sp_info.key = data[0] || "";
        sp_info.iv = data[1] || "";
        return callback(null, sp_info);
    });
};


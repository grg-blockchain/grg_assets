var mysql = require('../common/mysql');
var logger = require('../common/log')("user_account");
var async = require('async');
var result = require('../common/result')();
var WXBizDataCrypt = require('../lib/WXBizDataCrypt');
var config = require('../config');

exports.test_func1 = function () {
    return "ok";
};

exports.test_func2 = function () {
    return this.test_func1();
};

exports.getCrUserInfo = function (cr_type, cr_num, callback) {
    if (cr_type === "" || cr_num === "") {
        return callback(result.err_code.ERR_PARAMS_INVALID);
    }

    let sql_str = "select cr_type, cr_num, cr_name, mobile from t_node_user_cr_info where cr_type = ? and cr_num = ? ";
    let params = [cr_type, cr_num];
        mysql.query(sql_str, params, function (error, data) {
        if (error) {
            logger.error(JSON.stringify(err));
            return callback(result.err_code.ERR_DB_ERROR);
        }

        if (data.length == 0) {
            return callback(result.err_code.ERR_CR_NUM_NOT_YET_REGISTED);
        }
        return callback(null, data[0]);
    });
};




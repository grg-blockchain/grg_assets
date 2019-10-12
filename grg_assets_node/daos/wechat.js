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

exports.getWxUserInfo = function (openid, mobile, callback) {
    if (openid === "" && mobile === "") {
        return callback(result.err_code.ERR_PARAMS_INVALID);
    }

    let sql_str = "select * from t_node_user_openid_info where type = 1 ";
    let params = [];
    if (openid !== "") {
        sql_str += " and openid = ? ";
        params.push(openid);
    }
    if (mobile !== "") {
        sql_str += " and mobile = ? ";
        params.push(mobile);
    }

    mysql.query(sql_str, params, function (error, data) {
        if (error) {
            return callback(result.err_code.ERR_DB_ERROR);
        }

        if (data.length == 0) {
            return callback(result.err_code.ERR_WECHAT_NEED_LOGIN_AGAIN);
        }

        logger.info("get the user wechat info:" + JSON.stringify(data[0]));
        return callback(null, data[0]);
    });
};


exports.decryptData = function (openid, encryptedData, iv, callback) {
    var self = this;
    async.waterfall([
        function (callback) {
            self.getWxUserInfo(openid, '', function (err, vx_user) {
                if (err) {
                    return callback(err);
                }

                // decrypt
                try {
                    let pc = new WXBizDataCrypt(config.third_account.wechat.app_id, vx_user.session_key);
                    let data = pc.decryptData(encryptedData, iv);
                    return callback(null, data);
                }
                catch (e) {
                    logger.error(JSON.stringify(e));
                    return callback(result.err_code.ERR_WECHAT_NEED_LOGIN_AGAIN);
                }

            });
        }
    ], function (err, data) {
        if (err) {
            return callback (err);
        }
        return callback(null, data);
    });
};

var test_config = require("./test_config");
var utils = require('./utils');
let common_utils = require('../common/utils');
let async = require("async");
let mysql = require("../common/mysql");
var result = require('../common/result')();

var option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/sp_api/release_score_to_user_by_cr', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} //设置content-type 头部
};


let key = "";
let iv = "";
async.waterfall([
    function (callback) {
        let sql_str = "select aes_key from t_sp_info where sp_id = ?";
        let params = [test_config.test_sp[0].sp_id];
        mysql.query(sql_str, params, function (err, data) {
            if (err) {
                console.log(err);
                return callback(result.err_code.ERR_DB_ERROR);
            }
            if (data.length === 0) {
                return callback(result.err_code.ERR_SP_ID_NOT_EXIST);
            }
            data = data[0].aes_key.split("_");
            key = data[0];
            iv = data[1];
            return callback(null, null);
        });
    },
    function (data, callback) {
        console.log("-------正常逻辑-----");
        let params = {
            sp_id: test_config.test_sp[0].sp_id,
            cr_type: 0,
            cr_num: "110101111111111111",
            score: 10000,
            query_time: common_utils.getDatetime(),
        };
        params.signature = common_utils.genSignature("" + params.sp_id + params.cr_type + params.cr_num +
            params.score + params.query_time,
            key, iv);
        utils.doPost(option, params, function (error, res) {
            console.log(res);
            return callback(null, null);
        });
    },
    function (data, callback) {
        console.log("-------商户余额不足-----");
        let params = {
            sp_id: test_config.test_sp[0].sp_id,
            cr_type: 0,
            cr_num: "110101111111111111",
            score: 1000000000000000,
            query_time: common_utils.getDatetime(),
        };
        params.signature = common_utils.genSignature("" + params.sp_id + params.cr_type + params.cr_num +
            params.score + params.query_time,
            key, iv);
        utils.doPost(option, params, function (error, res) {
            console.log(res);
            return callback(null, null);
        });
    },
    function (data, callback) {
        console.log("-------未注册的用户-----");
        let params = {
            sp_id: test_config.test_sp[0].sp_id,
            cr_type: 0,
            cr_num: "sdfsfdsdfsfsdfsdf",
            score: 10,
            query_time: common_utils.getDatetime(),
        };
        params.signature = common_utils.genSignature("" + params.sp_id + params.cr_type + params.cr_num +
            params.score + params.query_time,
            key, iv);
        utils.doPost(option, params, function (error, res) {
            console.log(res);
            return callback(null, null);
        });
    }
], function (err, data) {
    if (err) {
        console.log(err);
    }
    console.log(data);
    process.exit();
});

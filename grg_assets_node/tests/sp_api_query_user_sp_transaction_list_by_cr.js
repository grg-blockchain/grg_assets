let test_config = require("./test_config");
let utils = require('./utils');
let common_utils = require('../common/utils');
let async = require("async");
let mysql = require("../common/mysql");
let result = require('../common/result')();

let option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/sp_api/query_user_sp_transaction_list_by_cr', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} //设置content-type 头部
};
var params = {
    sp_id: test_config.test_sp[0].sp_id,
    cr_type: 0,
    cr_num: "445281199402241568",
    query_time: common_utils.getDatetime(),
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
        params.signature = common_utils.genSignature("" + params.sp_id + params.cr_type + params.cr_num + params.query_time,
            key, iv);
        utils.doPost(option, params, function (error, res) {
            console.log(res);
            return callback(null, null);
        });
    },
    function (data, callback) {
        console.log("-------未注册的用户-----");
        params.cr_type = 0;
        params.cr_num = "sdfsfdsdfsfsdfsdf";
        params.signature = common_utils.genSignature("" + params.sp_id + params.cr_type + params.cr_num + params.query_time,
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

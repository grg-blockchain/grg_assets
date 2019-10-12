let test_config = require("./test_config");
let utils = require('./utils');
let common_utils = require('../common/utils');
let async = require("async");
let mysql = require("../common/mysql");
var result = require('../common/result')();
let redis = require("../common/redis");

let fs= require("fs");
let cookie = "";
let aes_key = ""
try {
    cookie = fs.readFileSync("account_login.cookie");
    aes_key = fs.readFileSync("aeskey.cookie").toString();
}
catch (e) {
    console.log(e.toString());
    return;
}
let data = aes_key.split("_");
let key = data[0];
let iv = data[1];

let option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/sp_api/entrusted_pay_by_qr', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} //设置content-type 头部
};

let user_info = {
    mobile: 13966666666,
    // is_grg_score:1,
    query_time: common_utils.getDatetime(),
};
user_info.signature = common_utils.genSignature("" + user_info.mobile + user_info.query_time, key, iv);

let params = {
    sp_id: test_config.test_sp[0].sp_id,
    user_info: JSON.stringify(user_info),
    score: 999999999,
    query_time: common_utils.getDatetime(),
};

let sp_key = "";
let sp_iv = "";
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
            sp_key = data[0];
            sp_iv = data[1];
            return callback(null, null);
        });
    },
    function (data, callback) {
        params.signature = common_utils.genSignature("" + params.sp_id + params.user_info + params.score + params.query_time,
            sp_key, sp_iv);
        console.log(params);
        utils.doPost(option, params, function (error, res) {
            res = JSON.parse(res);
            console.log(JSON.stringify(res));
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




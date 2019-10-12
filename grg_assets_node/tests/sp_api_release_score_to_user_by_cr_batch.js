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

let index = 0;
async.doWhilst(
    function (callback) {
        let sql_str = "select sp_id, aes_key from t_sp_info where id = ?";
        let params = [index];
        mysql.query(sql_str, params, function (err, data) {
            if (err) {
                console.log(err);
                return callback(null, null);
            }
            if (data.length === 0) {
                return callback(null, null);
            }
            let aes_key = data[0].aes_key.split("_");
            let sp_id = data[0].sp_id;
            let key = aes_key[0];
            let iv = aes_key[1];

            let params = {
                sp_id: sp_id,
                cr_type: 0,
                cr_num: "110101111111111112",
                score: 100,
                query_time: common_utils.getDatetime(),
            };
            params.signature = common_utils.genSignature("" + params.sp_id + params.cr_type + params.cr_num +
                params.score + params.query_time,
                key, iv);
            utils.doPost(option, params, function (error, res) {
                console.log(res);
                return callback(null, null);
            });
        });
    },
    function () {
        index += 1;
        return index <= 100;
    },
    function (err) {
        console.log(err);

    }
);

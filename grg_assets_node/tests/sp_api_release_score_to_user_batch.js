var test_config = require("./test_config");
var utils = require('./utils');
let common_utils = require('../common/utils');
let async = require("async");
let mysql = require("../common/mysql");
let result = require('../common/result')();

let arguments = process.argv;
if (arguments[2] == undefined) {
    console.log("please specify a mobile");
    return;
}
let mobile = arguments[2];

var option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/sp_api/release_score_to_user', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} //设置content-type 头部
};


let sp_list = [];
async.waterfall([
    function (callback) {
        let sql_str = "select sp_id, aes_key from t_sp_info";
        mysql.query(sql_str, [], function (err, data) {
            if (err) {
                console.log(err);
                return callback(-1);
            }
            if (data.length == 0) {
                console.log("empty record");
                return callback(-1);
            }
            sp_list = data;
            return callback(null, null);
        });
    },
    function (data, callback) {
        releaseScore(sp_list, callback);
    }
], function (err, data) {
    if (err) {
        console.log(err);
    }
});

function releaseScore(sp_list, next) {
    let index = 0;
    async.doWhilst(
        function (callback) {
            let aes_key = sp_list[index].aes_key.split("_");
            let sp_id = sp_list[index].sp_id;
            let key = aes_key[0];
            let iv = aes_key[1];

            let params = {
                sp_id: sp_id,
                mobile: mobile,
                score: 100,
                query_time: common_utils.getDatetime(),
            };
            params.signature = common_utils.genSignature("" + params.sp_id + params.mobile + params.score + params.query_time,
                key, iv);
            utils.doPost(option, params, function (error, res) {
                console.log(res);
                return callback(null, null);
            });
        },
        function () {
            index += 1;
            return index < sp_list.length;
        },
        function (err) {
            if (err) {
                console.log(err);
            }
        }
    );
    return next(null, null);
}


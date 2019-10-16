var test_config = require("./test_config");
var utils = require('./utils');
let common_utils = require('../common/utils');

let option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/user_account/login', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} //设置content-type 头部
};
let data = {};
utils.doPost(option, data, function (error, res, headers) {
    // res = JSON.parse(res);
    console.log(res);
    console.log(headers["set-cookie"][0])
});
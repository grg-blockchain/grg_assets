var test_config = require("./test_config");
var utils = require('./utils');
let common_utils = require('../common/utils');

let fs= require("fs");
let cookie = "";
let aes_key = "";
try {
    cookie = fs.readFileSync("account_login.cookie");
    aes_key = fs.readFileSync("aeskey.cookie").toString();
}
catch (e) {
    console.log(e.toString())
    return;
}
let data = aes_key.split("_");
let key = data[0];
let iv = data[1];

let option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/user_account/set_pay_password', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Cookie': cookie} //设置content-type 头部
};

data = {
    pay_password: common_utils.sign("123456"),
    query_time: common_utils.getDatetime(),
};
data.signature = common_utils.genSignature("" + data.pay_password + data.query_time, key, iv);

utils.doPost(option, data, function (error, res) {
    // res = JSON.parse(res);
    console.log(res);
});
let test_config = require("./test_config");
let utils = require('./utils');
let common_utils = require('../common/utils');
const crypto = require('crypto');

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
let params = aes_key.split("_");
let key = params[0];
let iv = params[1];

var option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/user_trans/pay', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Cookie': cookie} //设置content-type 头部
};
params = {
    payer_sp_id: test_config.test_sp[0].sp_id,
    score: 10,
    payee_sp_id: test_config.test_sp[0].sp_id,
    extern_info: "我在北京西二旗辉煌国际分店吃肯德基",
    pay_password: common_utils.base64_encode(common_utils.sign(test_config.test_user[0].pay_password)),
    query_time: common_utils.getDatetime(),
};
params.signature = common_utils.genSignature(
    "" + params.payer_sp_id + params.score + params.payee_sp_id + params.extern_info + params.pay_password + params.query_time,
    key, iv);

console.log(params);
utils.doPost(option, params, function (error, res) {
    res = JSON.parse(res);
    console.log(res);
});
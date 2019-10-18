var test_config = require("./test_config");
var utils = require('./utils');

let fs= require("fs");
let cookie = null;
try {
    cookie = fs.readFileSync("account_login.cookie");
}
catch (e) {}

var option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/user_assets/transfer', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Cookie': cookie} //设置content-type 头部
};
var data = {
    asset_id: 3,
    mobile: "13666666666",
    extern_info: "",
    pay_password: "test",
    query_time: "test",
    signature: "test"
};


utils.doPost(option, data, function (error, res) {
    // res = JSON.parse(res);
    console.log(res);
});
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
    path: '/mall/post_order', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Cookie': cookie} //设置content-type 头部
};
assets_list  = [7,8];
var data = {
    assets_list: JSON.stringify(assets_list)
};


utils.doPost(option, data, function (error, res) {
    // res = JSON.parse(res);
    console.log(res);
});
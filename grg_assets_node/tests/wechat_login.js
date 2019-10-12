var test_config = require("./test_config");
var utils = require('./utils');
var commonUtils = require('../common/utils');

var option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/wechat/login', //斜杠开头
    method:'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        // 'Cookie': 'sid=s%3AxKB88SAu1-ynWRhcfR0awnULFGZsQPga.dhhK%2FePJLM0eoJcj%2F0PQHu3dfhGvlsJKSMY8ALZ2Oeo; Path=/; Expires=Thu, 07 Mar 2019 00:53:03 GMT; HttpOnly',
    } //设置content-type 头部
};

var data = {
    code: "sdfsdfsdfsdf",
};


utils.doPost(option, data, function (error, res) {
    res = JSON.parse(res);
    console.log(res);
    console.log(res.cookies);
});

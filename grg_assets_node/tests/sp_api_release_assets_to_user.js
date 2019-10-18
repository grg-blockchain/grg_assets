var test_config = require("./test_config");
var utils = require('./utils');
let common_utils = require('../common/utils');

let arguments = process.argv;
if (arguments[2] == undefined) {
    console.log("please specify a mobile");
    return;
}
let mobile = arguments[2];

var option = {
    host: test_config.host, //注意:不用协议部分(http://)
    port: test_config.port,
    path: '/sp_api/release_assets_to_user', //斜杠开头
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} //设置content-type 头部
};
let params = [
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "星际穿越",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "飞扬影城天河城店",
            address: "天河城三楼",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    },
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "星球大战-原力觉醒",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "飞扬影城天河城店",
            address: "天河城三楼",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    },
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "流浪地球",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "飞扬影城天河城店",
            address: "天河城三楼",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    },
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "霍比特人",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "飞扬影城天河城店",
            address: "天河城三楼",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    }
];

for (let index in params) {
    utils.doPost(option, params[index], function (err, res) {
        console.log(res)
    });
}

params = [
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "星际穿越",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "广州百丽宫影城天环店",
            address: "天河路天环广场地下一层",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    },
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "星球大战-原力觉醒",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "广州百丽宫影城天环店",
            address: "天河路天环广场地下一层",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    },
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "流浪地球",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "广州百丽宫影城天环店",
            address: "天河路天环广场地下一层",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    },
    {
        sp_id: "999",
        mobile: "13661631812",
        sp_type: 0,
        name: "霍比特人",
        type:"film",
        balance: 1,
        expire_time: "2019-10-16 20:00:00",
        description: JSON.stringify({
            cinema: "广州百丽宫影城天环店",
            address: "天河路天环广场地下一层",
            time: "2019-10-16 20:00:00",
            hall: "3D max厅",
            row: 5,
            seat: 10
        })
    }
];

for (let index in params) {
    utils.doPost(option, params[index], function (err, res) {
        console.log(res)
    });
}
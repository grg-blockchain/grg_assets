let express = require('express');
let router = express.Router();

let result = require('../common/result')();
let logger = require('../common/log')("wxaccount");
let async = require('async');
let config = require('../config');
let mysql = require('../common/mysql');
let utils = require('../common/utils');
let redis = require('../common/redis');
const Joi = require("joi");
// require("joi-router")

router.post('/index',function(req,res,next){
    return res.send(result.Result({
        banners: [
            {
                img_url: "images/f1.jpg",
                query_url: "",
                desc: "星际穿越",
            },
            {
                img_url: "images/f2.jpg",
                query_url: "",
                desc: "星球大战-原力觉醒",
            },
            {
                img_url: "images/f3.jpg",
                query_url: "",
                desc: "流浪地球",
            },
            {
                img_url: "images/f4.jpg",
                query_url: "",
                desc: "霍比特人",
            },
        ],
        new_assets: [
            {
                img_url: "images/f1.jpg",
                query_url: "",
                desc: "星际穿越",
            },
            {
                img_url: "images/f2.jpg",
                query_url: "",
                desc: "星球大战-原力觉醒",
            },
            {
                img_url: "images/f3.jpg",
                query_url: "",
                desc: "流浪地球",
            },
            {
                img_url: "images/f4.jpg",
                query_url: "",
                desc: "霍比特人",
            },
        ],
        hot_assets: [
            {
                img_url: "images/f1.jpg",
                query_url: "",
                desc: "星际穿越",
            },
            {
                img_url: "images/f2.jpg",
                query_url: "",
                desc: "星球大战-原力觉醒",
            },
            {
                img_url: "images/f3.jpg",
                query_url: "",
                desc: "流浪地球",
            },
            {
                img_url: "images/f4.jpg",
                query_url: "",
                desc: "霍比特人",
            },
        ],
    }));
});

router.post('/sale_list',function(req, res, next){
    let schema = {
        sp_id: Joi.string().default(""),
        sp_type: Joi.string().default(""),
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    value = value.value;

    let sql_str = "select * from t_node_mall where true ";
    let params = [];
    if (value.sp_id != "") {
        sql_str += "and sp_id = ? ";
        params.push(value.sp_id);
    }
    if (value.sp_type != "") {
        sql_str += "and sp_type = ? ";
        params.push(value.sp_type);
    }

    mysql.query(sql_str, params, function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.send(result.Result({}, result.err_code.ERR_DB_ERROR));
        }
        return res.send(result.Result(data));
    })

});

router.post('/sale',function(req, res, next){
    let schema = {
        sale_list: Joi.string().required()
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    value = value.value;

    let sale_list = JSON.parse(value.sale_list);
    let mysql_connection = null;
    async.waterfall([
        function(callback) {
            mysql.getConnection(function (error, connection) {
                if(error) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                mysql_connection = connection;
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql_connection.beginTransaction(function (error) {
                if (error) {
                    logger.error("start transaction failed.");
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let index = 0;
            async.whilst(function () {
                return index < sale_list.length;
            }, function (callback) {
                sale_assets(mysql_connection, req.session.mobile, sale_list[index].asset_id, sale_list[index].price, function (err, data) {
                    if (err) {
                        return callback(err);
                    }
                    index += 1;
                    callback(null, null);
                });
            }, callback)
        }
    ],function(err, data){
        if(err){
            logger.error(err);
            mysql.transFailed(mysql_connection);
            return res.send(result.Result({}, err));
        }
        mysql.transSuccess(mysql_connection);
        return res.send(result.Result({}));
    });
});

function sale_assets(mysql_conn, mobile, asset_id, price, next) {
    let assets = {};
    async.waterfall([
        function (callback) {
            let sql_str = "select * from t_node_user_assets where mobile = ? and id = ? and balance > 0";
            let params = [mobile, asset_id];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length == 0) {
                    return callback(result.err_code.ERR_ASSET_IS_NOT_BELONG_YOU);
                }
                assets = data[0];
                callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "delete from t_node_user_assets where mobile = ? and id = ? and balance > 0";
            let params = [mobile, asset_id];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_mall (seller_id, seller_type, sp_id, sp_type, name, type, balance, price, description, image_url, expire_time, create_time, update_time) " +
                "value (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            let params = [assets.mobile, 1, assets.sp_id, assets.sp_type, assets.name, assets.type, assets.balance, price, assets.description, assets.image_url, assets.expire_time, utils.getDatetime(), utils.getDatetime()];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                callback(null, null);
            });
        }
    ], next)
}


router.post('/off_sale',function(req, res, next){
    let schema = {
        off_sale_list: Joi.string().required()
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    value = value.value;

    let off_sale_list = JSON.parse(value.off_sale_list);
    let mysql_connection = null;
    async.waterfall([
        function(callback) {
            mysql.getConnection(function (error, connection) {
                if(error) {
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                mysql_connection = connection;
                return callback(null, null);
            });
        },
        function (data, callback) {
            mysql_connection.beginTransaction(function (error) {
                if (error) {
                    logger.error("start transaction failed.");
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let index = 0;
            async.whilst(function () {
                return index < off_sale_list.length;
            }, function (callback) {
                off_sale_assets(mysql_connection, req.session.mobile, off_sale_list[index], function (err, data) {
                    if (err) {
                        return callback(err);
                    }
                    index += 1;
                    callback(null, null);
                });
            }, callback)
        }
    ],function(err, data){
        if(err){
            logger.error(err);
            mysql.transFailed(mysql_connection);
            return res.send(result.Result({}, err));
        }
        mysql.transSuccess(mysql_connection);
        return res.send(result.Result({}));
    });
});

function off_sale_assets(mysql_conn, mobile, asset_id, next) {
    let assets = {};
    async.waterfall([
        function (callback) {
            let sql_str = "select * from t_node_mall where seller_id = ? and seller_type = ? and id = ? and balance > 0";
            let params = [mobile, 1, asset_id];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length == 0) {
                    return callback(result.err_code.ERR_ASSET_IS_NOT_BELONG_YOU);
                }
                assets = data[0];
                callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "delete from t_node_mall where seller_id = ? and seller_type = ? and id = ? and balance > 0";
            let params = [mobile, 1, asset_id];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                callback(null, null);
            });
        },
        function (data, callback) {
            //  id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
            // 	mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产持有者手机号',
            // 	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产发行者商户id',
            // 	sp_type INT(1) NOT NULL DEFAULT 0 COMMENT '资产发行者，【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
            // 	name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '数字资产名字',
            // 	#assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产id',
            // 	type VARCHAR(64) NOT NULL DEFAULT '' COMMENT '数字资产类型。【film】电影票',
            // 	balance INT NOT NULL DEFAULT 0 COMMENT '资产余额',
            // 	price INT NOT NULL DEFAULT 0 COMMENT '资产价值',
            // 	description TEXT COMMENT '资产说明',
            // 	image_url VARCHAR(256) NOT NULL DEFAULT '' COMMENT '资产图标url',
            //
            // 	expire_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '过期时间',
            // 	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
            // 	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

            let sql_str = "insert into t_node_user_assets (mobile, sp_id, sp_type, name, type, balance, price, description, image_url, expire_time, create_time, update_time) " +
                "value (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            let params = [mobile, assets.sp_id, assets.sp_type, assets.name, assets.type, assets.balance, assets.price, assets.description, assets.image_url, assets.expire_time, utils.getDatetime(), utils.getDatetime()];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                callback(null, null);
            });
        }
    ], next)
}
module.exports = router;
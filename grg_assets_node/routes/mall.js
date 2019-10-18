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
                upper_shelf(mysql_connection, req.session.mobile, sale_list[index].asset_id, sale_list[index].price, function (err, data) {
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

function upper_shelf(mysql_conn, mobile, asset_id, price, next) {
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
                off_shelf(mysql_connection, req.session.mobile, off_sale_list[index], function (err, data) {
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

function off_shelf(mysql_conn, mobile, asset_id, next) {
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

function transfer(mysql_conn, mobile, asset_id, next) {
    let assets = {};
    async.waterfall([
        function (callback) {
            let sql_str = "select * from t_node_mall where id = ? and balance > 0";
            let params = [asset_id];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                if (data.length == 0) {
                    return callback(result.err_code.ERR_ASSET_IS_NOT_EXIST);
                }
                assets = data[0];
                if (assets.seller_id == mobile) {
                    return callback(result.err_code.ERR_ASSET_IS_BELONG_YOU);
                }
                callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "delete from t_node_mall where id = ? and balance > 0";
            let params = [asset_id];
            mysql_conn.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                callback(null, null);
            });
        },
        function (data, callback) {
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

router.post('/post_order',function(req, res, next){
    let schema = {
        assets_list: Joi.string().required()
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    value = value.value;

    let assets_list = JSON.parse(value.assets_list);
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
                return index < assets_list.length;
            }, function (callback) {
                transfer(mysql_connection, req.session.mobile, assets_list[index], function (err, data) {
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


module.exports = router;
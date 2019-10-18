let express = require('express');
let router = express.Router();

let mysql = require('../common/mysql');
let result = require('../common/result')();
let logger = require('../common/log')("user_account");
let async = require('async');
let sp = require('../daos/sp');
let cr = require('../daos/cr');
let utils = require('../common/utils');
let score = require('../daos/assets');
let trans = require('../daos/trans');
let redis = require('../common/redis');
const Joi = require("joi");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

function checkSpSignature (sp_id, data, signature, callback) {
    sp.queryInfo(sp_id,  function (err, sp_info) {
        if (err) {
            return callback(err);
        }
        if (!utils.checkSignature(data, sp_info.key, sp_info.iv, signature)) {
            return callback(result.err_code.ERR_SIGNATURE_ERROR)
        }
        return callback(null, null);
    });

}
router.post('/release_assets_to_user', function (req, res, next) {
    let schema = {
        sp_id: Joi.string().required(),
        mobile: Joi.string().required(),
        sp_type: Joi.number().required(),
        name: Joi.string().required(),
        assets_type: Joi.string().required(),
        balance: Joi.number().required(),
        expire_time: Joi.string().required(),
        description: Joi.string().required(),
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    value = value.value;

    let sql_str = "insert into t_node_user_assets (mobile, sp_id, sp_type, name, assets_type, balance, description, expire_time) " +
        "values (?, ?, ?, ?, ?, ?, ?, ?)";
    let params = [value.mobile, value.sp_id, value.sp_type, value.name, value.assets_type, value.balance, value.description, value.expire_time];
    mysql.query(sql_str, params, function (err, data) {
        if (err) {
            logger.error(err);
            return res.send(result.Result({}, result.err_code.ERR_DB_ERROR));
        }
        return res.send(result.Result({}));
    });

    // async.waterfall([
    //     function (callback) {
    //         let data = "" + req.body.sp_id + req.body.mobile + req.body.score + req.body.query_time;
    //         return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
    //     },
    //     function (data, callback) {
    //
    //     }
    // ], function (err, data) {
    //     if (err) {
    //         return res.send(result.Result({}, err));
    //     }
    //     return res.send(result.Result(data));
    // });
});

router.post('/release_score_to_user_by_cr', function (req, res, next) {
    if (utils.checkEmpty(req.body.sp_id) || utils.checkEmpty(req.body.cr_type) ||
        utils.checkEmpty(req.body.cr_num) || utils.checkEmpty(req.body.score) ||
        utils.checkEmpty(req.body.query_time) || utils.checkEmpty(req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }

    // if (req.body.sp_id === undefined || req.body.cr_type === undefined ||
    //     req.body.cr_num === undefined || req.body.score === undefined ||
    //     req.body.signature === undefined || req.body.query_time === undefined) {
    //     return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    // }
    let state_msg = req.body.state_msg || "";
    let cr_info = {};
    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num + req.body.score + req.body.query_time;
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            cr.getCrUserInfo(req.body.cr_type, req.body.cr_num, function (err, data) {
                if (err) {
                    return callback(err);
                }
                cr_info = data;
                return callback(null, null);
            });
        },
        function (data, callback) {
            releaseScoreToUser(req.body.sp_id, cr_info.mobile, req.body.score, state_msg, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result(data));
    });

});

router.post('/query_user_sp_transaction_list', function (req, res, next) {
    if (req.body.mobile === undefined || req.body.sp_id === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    let from_time = req.body.time_begin || "1970-01-01 00:00:00";
    let to_time = req.body.time_end || utils.getDatetime();
    let mobile = req.body.mobile;
    let sp_id = req.body.sp_id;
    let type = req.body.type || "";
    let state = req.body.state || "";
    let order_by_desc = req.body.order_by_desc || "true";
    let page = req.body.page || 0;
    let count = req.body.count || 20;

    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num +
                req.body.time_begin + req.body.time_end + req.body.page + req.body.count + req.body.query_time;
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            trans.queryList(from_time, to_time, mobile, sp_id, type, state, order_by_desc, page, count, callback);
        }
    ], function (err, data) {
        if(err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result(data));
    });
});

router.post('/query_user_sp_transaction_list_by_cr', function (req, res, next) {
    if (utils.checkEmpty(req.body.cr_type) || utils.checkEmpty(req.body.cr_num) ||
        utils.checkEmpty(req.body.sp_id) || utils.checkEmpty(req.body.query_time) || utils.checkEmpty(req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    // if (req.body.cr_type === undefined || req.body.cr_num === undefined || req.body.sp_id === undefined) {
    //     return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    // }
    let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num +
        (req.body.time_begin || "") + (req.body.time_end || "") + (req.body.page || "") + (req.body.count || "") + (req.body.order_by_desc || "") +
        req.body.query_time;

    let from_time = req.body.time_begin || "1970-01-01 00:00:00";
    let to_time = req.body.time_end || utils.getDatetime();
    let cr_type = req.body.cr_type;
    let cr_num = req.body.cr_num;
    let sp_id = req.body.sp_id;
    let type = req.body.type || "";
    let state = req.body.state || "";
    let order_by_desc = req.body.order_by_desc || "true";
    let page = req.body.page || 0;
    let count = req.body.count || 20;

    async.waterfall([
        function (callback) {
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            cr.getCrUserInfo(cr_type, cr_num, callback);
        },
        function (data, callback) {
            trans.queryList(from_time, to_time, data.mobile, sp_id, type, state, order_by_desc, page, count, callback);
        }
    ], function (err, data) {
        if(err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result(data));
    });
});

router.post('/query_user_sp_score_status', function (req, res, next) {
    if (req.body.mobile === undefined || req.body.sp_id === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }

    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num + req.body.query_time;
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            score.queryUserSpScoreStatus(req.body.mobile, req.body.sp_id, utils.getDatetime(), callback);
        }
    ], function (err, data) {
        if(err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result(data));
    });

});

router.post('/query_user_sp_score_status_by_cr', function (req, res, next) {
    if (utils.checkEmpty(req.body.cr_type) || utils.checkEmpty(req.body.cr_num) ||
        utils.checkEmpty(req.body.sp_id) || utils.checkEmpty(req.body.query_time) || utils.checkEmpty(req.body.signature)) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }

    // if (req.body.cr_type === undefined || req.body.cr_num === undefined || req.body.sp_id === undefined) {
    //     return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    // }
    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num + req.body.query_time;
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            cr.getCrUserInfo(req.body.cr_type, req.body.cr_num, callback);
        },
        function (data, callback) {
            score.queryUserSpScoreStatus(data.mobile, req.body.sp_id, utils.getDatetime(), callback);
        }
    ], function (err, data) {
        if(err) {
            return res.send(result.Result({}, err));
        }
        return res.send(result.Result(data));
    });

});


router.post('/register_by_cr', function (req, res, next) {
    if (utils.checkEmpty(req.body.sp_id) || utils.checkEmpty(req.body.cr_type) ||
        utils.checkEmpty(req.body.cr_num) || utils.checkEmpty(req.body.mobile) ||
        utils.checkEmpty(req.body.query_time) ){
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    // if (req.body.sp_id === undefined || req.body.cr_type === undefined || req.body.cr_num === undefined ||
    //     req.body.mobile === undefined || req.body.query_time === undefined) {
    //
    // }
    let nick = req.body.cr_name || req.body.mobile;

    let datetime = utils.getDatetime();
    let mysql_connection = null;

    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num + req.body.cr_name +
                req.body.mobile + req.body.query_time;
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function(data, callback) {
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
            let sql_str = "select * from t_node_user_cr_info where cr_type = ? and cr_num = ?";
            let params = [req.body.cr_type, req.body.cr_num];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }

                if (data.length > 0) {
                    return callback(result.err_code.ERR_CR_NUM_ALREADY_REGISTED);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "select * from t_node_user_cr_info where mobile = ?";
            let params = [req.body.mobile];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }

                if (data.length > 0) {
                    return callback(result.err_code.ERR_MOBILE_ALREADY_REGISTED);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_user_cr_info (cr_type, cr_num, cr_name, mobile, create_time, update_time) " +
                "value (?, ?, ?, ?, ?, ?)";
            let params = [req.body.cr_type, req.body.cr_num, req.body.cr_name, req.body.mobile, datetime, datetime];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err && err.code === "ER_DUP_ENTRY") {
                    return callback(result.err_code.ERR_USER_ALREADY_EXIST, null);
                }
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            let sql_str = "insert into t_node_user_account (mobile, nick, create_time, update_time) value (?, ?, ?, ?)";
            let params = [req.body.mobile, nick, datetime, datetime];
            mysql_connection.query(sql_str, params, function (err, data) {
                if (err && err.code === "ER_DUP_ENTRY") {
                    return callback(null, null);
                }
                if (err) {
                    logger.error(JSON.stringify(err));
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, null);
            });
        }
    ],function(err, data){
        if(err){
            logger.error(err);
            mysql.transFailed(mysql_connection);
            return res.send(result.Result({}, err));
        }
        mysql.transSuccess(mysql_connection);
        return res.send(result.Result({}, null));
    });
});


router.post('/entrusted_pay_by_qr', function (req, res, next) {
    if (req.body.sp_id === undefined || req.body.user_info === undefined || req.body.score === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    if (req.body.score < 0) {
        return res.send(result.Result({}, result.err_code.ERR_SCORE_INVALID));
    }

    req.body.extern_info = req.body.extern_info || '';
    let user_info = null;
    let payer_sp_id = "";
    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.user_info + req.body.score +
                req.body.extern_info + req.body.query_time;
            logger.info("joint params: " + data);
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            user_info = JSON.parse(req.body.user_info);
            redis.get("user_aeskey_" + user_info.mobile, function (err, data) {
                if (err) {
                    return callback(result.err_code.ERR_REDIS_GET_FAILED);
                }

                if (data == null || data == "") {
                    return callback(result.err_code.ERR_USER_PAY_CODE_INVALID);
                }
                data = data.split("_");
                let key = data[0];
                let iv = data[1];
                user_info.is_grg_score = user_info.is_grg_score == undefined ? "" : user_info.is_grg_score;
                data = "" + user_info.mobile + user_info.is_grg_score + user_info.query_time;
                if (!utils.checkSignature(data, key, iv, user_info.signature)) {
                    return callback(result.err_code.ERR_USER_PAY_CODE_INVALID);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            score.queryUserBalance(user_info.mobile, req.body.sp_id, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.balance < req.body.score) {
                    if (user_info.is_grg_score && user_info.is_grg_score == 1) {
                        score.queryUserBalance(user_info.mobile, 0, function (err, data) {
                            if (err) {
                                return callback(err);
                            }
                            if (data.balance < req.body.score) {
                                return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
                            }
                            payer_sp_id = 0;
                            return callback(null, data);
                        });
                    }
                    else {
                        return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
                    }
                }
                else {
                    payer_sp_id = req.body.sp_id;
                    return callback(null, data);
                }

            });
        },
        function (data, callback) {
            trans.userPayToSp(user_info.mobile, payer_sp_id, req.body.score,
                req.body.sp_id, 3, req.body.extern_info, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(data));
    });
});

router.post('/entrusted_pay_by_mobile', function (req, res, next) {
    if (req.body.sp_id === undefined || req.body.mobile === undefined || req.body.score === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    if (req.body.score < 0) {
        return res.send(result.Result({}, result.err_code.ERR_SCORE_INVALID));
    }

    req.body.extern_info = req.body.extern_info || '';
    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.mobile + req.body.score +
                req.body.extern_info + req.body.query_time;
            logger.info("joint params: " + data);
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            score.queryUserBalance(req.body.mobile, req.body.sp_id, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.balance < req.body.score) {
                    return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            trans.userPayToSp(req.body.mobile, req.body.sp_id, req.body.score,
                req.body.sp_id, 3, req.body.extern_info, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(data));
    });
});

router.post('/entrusted_pay_by_cr', function (req, res, next) {
    if (req.body.sp_id === undefined || req.body.cr_type === undefined ||
        req.body.cr_num === undefined || req.body.score === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }
    if (req.body.score < 0) {
        return res.send(result.Result({}, result.err_code.ERR_SCORE_INVALID));
    }

    req.body.extern_info = req.body.extern_info || '';
    let cr_info = null;
    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num + req.body.score +
                req.body.extern_info + req.body.query_time;
            logger.info("joint params: " + data);
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            cr.getCrUserInfo(req.body.cr_type, req.body.cr_num, function (err, data) {
                if (err) {
                    return callback(err);
                }
                cr_info = data;
                return callback(null, null);
            });
        },
        function (data, callback) {
            score.queryUserBalance(cr_info.mobile, req.body.sp_id, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.balance < req.body.score) {
                    return callback(result.err_code.ERR_BALANCE_NOT_ENOUGH);
                }
                return callback(null, null);
            });
        },
        function (data, callback) {
            trans.userPayToSp(cr_info.mobile, req.body.sp_id, req.body.score,
                req.body.sp_id, 3, req.body.extern_info, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(data));
    });
});


router.post('/query_user_info_by_cr', function (req, res, next) {
    if (req.body.sp_id === undefined ||
        req.body.cr_type === undefined || req.body.cr_num === undefined ||
        req.body.query_time === undefined || req.body.signature === undefined) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID));
    }

    async.waterfall([
        function (callback) {
            let data = "" + req.body.sp_id + req.body.cr_type + req.body.cr_num + req.body.query_time;
            return checkSpSignature(req.body.sp_id, data, req.body.signature, callback);
        },
        function (data, callback) {
            cr.getCrUserInfo(req.body.cr_type, req.body.cr_num, callback);
        }
    ], function (err, data) {
        if (err) {
            return res.send(result.Result({}, err, data));
        }
        return res.send(result.Result(data));
    });
});

module.exports = router;

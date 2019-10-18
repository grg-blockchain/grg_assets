var express = require('express');
var router = express.Router();

var mysql = require('../common/mysql');
var result = require('../common/result')();
var logger = require('../common/log')("user_account");
var async = require('async');
var utils = require('../common/utils');
var assets = require('../daos/assets');
const Joi = require("joi");

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/query_cinema', function (req, res, next) {
    let schema = {
        film_name: Joi.string().required(),
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    let sql_str = "select * from t_node_user_assets where balance > 0 and name like '%" + value.value.film_name + "%'";
    mysql.query(sql_str, [], function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.send(result.Result({}, result.err_code.ERR_DB_ERROR));
        }
        let cinema_info = {};
        for (let index in data) {
            let film_desc = JSON.parse(data[index].description);
            let cinema_name = film_desc.cinema;
            if (!cinema_info.hasOwnProperty(cinema_name)) {
                cinema_info[cinema_name] = {
                    address: film_desc.address,
                    assets_id: []
                }
            }
            cinema_info[cinema_name].assets_id.push(data[index].id);
        }
        return res.send(result.Result(cinema_info));
    });
});

router.post('/query_ticket', function (req, res, next) {
    let schema = {
        cinema_name: Joi.string().required(),
        film_name: Joi.string().required(),
    };
    let value = Joi.validate(req.body, schema);
    if (value.error != null) {
        return res.send(result.Result({}, result.err_code.ERR_PARAMS_INVALID, value.error.message));
    }
    value = value.value;
    let sql_str = "select * from t_node_user_assets where balance > 0 and name like '%" + value.film_name + "%'";
    mysql.query(sql_str, [], function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.send(result.Result({}, result.err_code.ERR_DB_ERROR));
        }
        let result_data = {};
        for (let index in data) {
            let film_desc = JSON.parse(data[index].description);
            if ( value.cinema_name != film_desc.cinema) {
                continue;
            }

            data[index].description = film_desc;
            let time = data[index].description.time.split(" ");
            let day = time[0].split("-");
            day = day[1] + "月" + day[2] + "日";
            if (!result_data.hasOwnProperty(day)) {
                result_data[day] = {}
            }

            time = time[1].split(":");
            time = time[0] + ":" + time[1];
            if (!result_data[day].hasOwnProperty(time)) {
                result_data[day][time] = [];
            }

            result_data[day][time].push(data[index]);
        }


        return res.send(result.Result(result_data));
    });
});

module.exports = router;

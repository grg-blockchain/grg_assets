var mysql = require('mysql');
var config = require('../config');
var logger = require('./log')("mysql");

// 创建一个数据库连接池
var pool = mysql.createPool({
    connectionLimit: 1,
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    timezone:'Asia/Shanghai'
});

// SELECT * FROM users
// 让我们的方法支持两种模式
// 一种是只传入SQL语句和回调函数
// 一种是传入SQL语句、参数数据、回调函数

exports.query = function (sql, P, C) {
    var params = [];
    var callback;

    // 如果用户传入了两个参数，就是SQL和callback
    if (arguments.length === 2 && typeof arguments[1] === 'function') {
        callback = P;
    } else if (arguments.length === 3 && Array.isArray(arguments[1]) && typeof arguments[2] === 'function') {
        params = P;
        callback = C;
    } else {
        throw new Error('对不起，参数个数不匹配或者参数类型错误');
    }


    // 如果用户传入了三个参数，那么就是SQL和参数数组、回调函数


    // 从池子里面拿一个可以使用的连接
    pool.getConnection(function (err, connection) {
        // Use the connection
        connection.query(sql, params, function () {
            // 使用完毕之后，将该连接释放回连接池
            connection.release();
            if (arguments[0]) {
                logger.error(arguments);
            }
            callback.apply(null, arguments);
        });
    });
};

exports.getConnection = function (callback) {
    pool.getConnection(function (error, connection) {
        if (error) {
            console.log(error);
            return callback(error, null);
        }
        return callback(null, connection);
    });
}

exports.transSuccess = function (connection) {
    if (connection) {
        connection.commit();
        connection.release();
    }
}
exports.transFailed = function (connection) {
    if (connection) {
        connection.rollback();
        connection.release();
    }
}
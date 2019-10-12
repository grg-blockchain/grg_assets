var config = require('../config');

var redis_config = {
    "host": config.redis.host,
    "port": config.redis.port,
    "password": config.redis.password,
};


var redis = require('redis');
var logger = require("./log")("redis");

var redisClient = redis.createClient(redis_config);
redisClient.auth(redis_config.password,function(){
    logger.info('auth success');
});

redisClient.on('ready',function() {
    logger.info("redis connect success ");
});

redisClient.on('error',function() {
    logger.error("redis connect fail ");
});

redisClient.select(config.redis.db, function(error){
    if(error) {
        logger.error("redis select error " + error);
    } else {
        logger.info("select database " + config.redis.db + " success ");
    }
});

module.exports = redisClient;

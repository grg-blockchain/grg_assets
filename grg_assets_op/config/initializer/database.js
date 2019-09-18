
const config = require('config');
const redisConfig = config.get('redis');
const mysqlConfig = config.get('mysql')
const IoRedis = require('ioredis')
const Sequelize = require('sequelize');

const sequelize = new Sequelize(mysqlConfig.uri);

const redis = new IoRedis({
    port: redisConfig.port,
    host: redisConfig.host,
    password: redisConfig.password
});
  
redis.on('ready', function () {
    console.info(`[redis]redis ready: ${redisConfig.host}:${redisConfig.port}`);
});

redis.on('reconnecting', function () {
    console.info(`[redis]reconnecting redis: ${redisConfig.host}:${redisConfig.port}`);
});

redis.on('connect', function () {
    console.info(`[redis]connecting redis: ${redisConfig.host}:${redisConfig.port}`);
});

redis.on('error', function (err) {
    console.error('[redis]redis error: ', err);
});

module.exports = { sequelize, redis }
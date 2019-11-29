const { sequelize } = require('../../config/initializer');
const Sequelize = require('sequelize');
// 创建 Model
let FilmAsset = sequelize.define('t_sp_film_asset', {
    assetId: {
        type: Sequelize.STRING,
        field: 'asset_id'
    },
    name: { //电影名字
        type: Sequelize.STRING
    },
    theater: { //电影院名字
        type: Sequelize.STRING
    },
    language: {  //语言
        type: Sequelize.STRING
    },
    actor: {    //演员列表
        type: Sequelize.STRING
    },
    startTime: {
        type: Sequelize.STRING,
        field: 'start_time'
    },
    endTime: {
        type: Sequelize.STRING,
        field: 'end_time'
    },
    duration: {
        type: Sequelize.INTEGER
    },
    posterUrl: {//海报url
        type: Sequelize.STRING,
        field: 'poster_url'
    },
    hall: { //哪个厅
        type: Sequelize.STRING
    },
    position: {//座位
        type: Sequelize.STRING       
    },
    desc: {
        type: Sequelize.STRING
    },
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  Asset.sync({ force: false});

  module.exports = Asset;
const { sequelize } = require('../../config/initializer');
const Sequelize = require('sequelize');
// 创建 Model
let Asset = sequelize.define('t_sp_asset', {
    spUid: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    expiration: {
        type: Sequelize.INTEGER
    },
    price: {
        type: Sequelize.FLOAT
    },
    supply: {
        type: Sequelize.INTEGER
    },
    desc: {
        type: Sequelize.STRING
    },
    state: {
        type: Sequelize.STRING              //working: 发行中; suspend: 暂停，不可以发送给用户; stop: 停止这个资产的发送，不可以再发送 
    }
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  Asset.sync({ force: false});

  module.exports = Asset;
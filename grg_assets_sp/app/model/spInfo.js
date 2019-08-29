

const { sequelize } = require('../../config/initializer');

const Sequelize = require('sequelize');

// 创建 Model
let SpInfo = sequelize.define('spInfo', {
    name: {
      type: Sequelize.STRING,
    },
    mobile: {
      type: Sequelize.STRING
    },
    loginPassword: {
      type: Sequelize.STRING
    }
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  SpInfo.sync({ force: false});

  module.exports = SpInfo;
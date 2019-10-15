
const { sequelize } = require('../../config/initializer');
const Sequelize = require('sequelize');
// 创建 Model
let OpRecord = sequelize.define('opRecord', {
    pathname: {
        type: Sequelize.STRING,
    },
    originalUrl: {
      type: Sequelize.STRING,
      field: 'original_url'
    },
    method: {
        type: Sequelize.STRING
    },
    param: {
        type: Sequelize.JSON
    }
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  OpRecord.sync({ force: false});

  module.exports = OpRecord;
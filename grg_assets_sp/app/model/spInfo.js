

const { sequelize } = require('../../config/initializer');

const Sequelize = require('sequelize');

// 创建 Model
let SpInfo = sequelize.define('spInfo', {
    // 指定映射的字段类型，字段名，例如数据库中 user 表中的 username 字段映射成 username
    username: {
      type: Sequelize.STRING,
      field: 'username'
    },
    // 如果不指定 field，会自动映射相同名称的字段
    email: {
      type: Sequelize.STRING
    }
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  SpInfo.sync({ force: false});

  module.exports = SpInfo;
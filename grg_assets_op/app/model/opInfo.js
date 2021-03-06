

const { sequelize } = require('../../config/initializer');

const Sequelize = require('sequelize');

// 创建 Model
let OpInfo = sequelize.define('t_op_info', {
    name: {
      type: Sequelize.STRING,
    },
    mobile: {
      type: Sequelize.STRING
    },
    loginPassword: {
      type: Sequelize.STRING,
      field: 'login_passworld'
    },
    authority: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.STRING
    }
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  OpInfo.sync({ force: false});

  module.exports = OpInfo;
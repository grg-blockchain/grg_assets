

const { sequelize } = require('../../config/initializer');

const Sequelize = require('sequelize');

// 创建 Model
let GuarantyTransaction = sequelize.define('t_guaranty_transaction', {
    spUid: {
      type: Sequelize.STRING,
    },
    bank: {
      type: Sequelize.STRING
    },
    bankCard: {
      type: Sequelize.STRING
    },
    serialNumber: {
      type: Sequelize.STRING
    },
    quota: {
      type: Sequelize.FLOAT
    },
    desc: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.STRING        //auditing 审核中，pass 审核通过，fail 审核失败
    }
  }, {
    // freezeTabelName 为 true 时不会在库中映射表时增加复数表名
    // 该选项为 true 时，user 在映射时映射成 user，而为 false 时会映射成users
    freezeTableName: true
  });

  GuarantyTransaction.sync({ force: false});

  module.exports = GuarantyTransaction;
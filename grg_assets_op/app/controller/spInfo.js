

const { log, AppError } = require('../lib')
const Joi = require('joi')
const SpInfoService = require('../service/spInfo');
const _ = require('lodash');
class SpInfo {
    static async list (ctx) {
        const {opUid} = ctx.param
        const opts = {opUid}
        const schema = {
            opUid: Joi.string().required().error(new AppError('opUid错误')),
        };
        const spInfoService = new SpInfoService(opts, schema, ctx)
        ctx.body = await spInfoService.list()
    }
  }
  
  module.exports = SpInfo;
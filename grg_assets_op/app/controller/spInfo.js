

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

    static async audit (ctx) {
        console.log('ctx.param++>',ctx.param)
        const {opUid, spUid, state} = ctx.param
        const opts = {opUid, spUid, state}
        const schema = {
            opUid: Joi.string().required().error(new AppError('opUid错误')),
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            state: Joi.string().required().error(new AppError('state错误'))
        };
        console.log('ctx.param++==>',ctx.param)
        const spInfoService = new SpInfoService(opts, schema, ctx)
        ctx.body = await spInfoService.audit()
    }
  }
  
  module.exports = SpInfo;
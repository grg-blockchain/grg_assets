
const { log, AppError } = require('../lib')
const Joi = require('joi')
const GuarantyService = require('../service/guaranty');

class Guaranty {
    
    static async list(ctx) {
        const {opUid, bank, bankCard} = ctx.param
        const opts = {opUid, bank, bankCard}
        const schema = {
            opUid: Joi.string().required().error(new AppError('opUid错误')),
            bank: Joi.string().allow(''),
            bankCard: Joi.string().allow('')
        }
        const guarantyService = new GuarantyService(opts, schema, ctx)
        ctx.body = await guarantyService.list()
    }

    static async audit(ctx) {
        const {opUid, spUid, guarantyTransactionId, state} = ctx.param
        const opts = {opUid, spUid, guarantyTransactionId, state}
        const schema = {
            opUid: Joi.string().required().error(new AppError('opUid错误')),
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            guarantyTransactionId: Joi.string().required().error(new AppError('guarantyTransactionId错误')),
            state: Joi.string().required().error(new AppError('state错误'))
        }
        const guarantyService = new GuarantyService(opts, schema, ctx)
        ctx.body = await guarantyService.audit()
    }
}

module.exports = Guaranty;
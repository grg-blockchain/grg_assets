
const { log, AppError } = require('../lib')
const Joi = require('joi')
const GuarantyService = require('../service/guaranty');

class Guaranty {
    static async submit(ctx) {
        const opts = ctx.param
        const schema = {
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            bank: Joi.string().required().error(new AppError('bank错误')),
            bankCard: Joi.string().required().error(new AppError('bankCard错误')),
            serialNumber: Joi.string().required().error(new AppError('serialNumber错误')),
            quota: Joi.number().required().error(new AppError('quota错误')),
            desc: Joi.string()
        }
        const guarantyService = new GuarantyService(opts, schema, ctx)
        ctx.body = await guarantyService.submit()
    }
    static async getDetail(ctx) {
        const opts = ctx.param
        const schema = {
            spUid: Joi.string().required().error(new AppError('spUid错误'))
        }
        const guarantyService = new GuarantyService(opts, schema, ctx)
        ctx.body = await guarantyService.getDetail()
    }
}

module.exports = Guaranty;
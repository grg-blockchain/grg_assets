const { log, AppError } = require('../lib')
const Joi = require('joi')
const AssetService = require('../service/asset');

class Asset {
    static async approve(ctx) {
        const opts = ctx.param
        const schema = {
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            name: Joi.string().required().error(new AppError('name错误')),
            expiration: Joi.number().required().error(new AppError('expiration错误')),
            supply: Joi.number().required().error(new AppError('supply错误')),
            price: Joi.number().required().error(new AppError('price错误')),
            desc: Joi.string()
        }
        const assetService = new AssetService(opts, schema, ctx)
        ctx.body = await assetService.approve()
    }
    static async setSupply(ctx) {
        const opts = ctx.param
        const schema = {
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            assetId: Joi.string().required().error(new AppError('assetId错误')),
            supply: Joi.number().min(0).required().error(new AppError('supply错误'))
        }
        const assetService = new AssetService(opts, schema, ctx)
        ctx.body = await assetService.setSupply()
    }
    static async list(ctx) {
        const opts = ctx.param
        const schema = {
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            name: Joi.string(),
            state: Joi.string()
        }
        const assetService = new AssetService(opts, schema, ctx)
        ctx.body = await assetService.list()
    }
    static async getDetail(ctx) {
        const opts = ctx.param
        console.log('===========opts=====>',opts)
        const schema = {
            spUid: Joi.string().required().error(new AppError('spUid错误')),
            assetId: Joi.string().required().error(new AppError('assetId错误'))
        }
        const assetService = new AssetService(opts, schema, ctx)
        ctx.body = await assetService.getDetail()
    }
}

module.exports = Asset;
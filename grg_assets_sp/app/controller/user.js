

const { SpInfo } = require('../model')
const { log, AppError } = require('../lib')
const Joi = require('joi')
const UserService = require('../service/user');
class User {
    static async info (ctx) {
        // 创建新用户
        // let jcInfo = await SpInfo.create({ username: "JC", email: "641750707@qq.com" })
        log.info('jcInfo ==>', ctx.param)
        // let r = await redis.get('aa')

        log.info('session user 0 =>', ctx.session.user)
        log.info('session user 1 =>', ctx.session.user)
        ctx.body = {'id': '12321213'}
    }

    static async register (ctx) {
        const opts = ctx.param
        const schema = {
            mobile: Joi.string().required(),
            loginPassword: Joi.string().required().error(new AppError('loginPassword错误')),
            payPassword: Joi.string().required().error(new AppError('payPassword错误')),
            name: Joi.string().required().error(new AppError('name错误')),
            simpleName: Joi.string().required().error(new AppError('simpleName错误')),
            spType: Joi.string().required().error(new AppError('spType错误')),
            address: Joi.string().required().error(new AppError('address错误')),
            registeredCapital: Joi.number().required().error(new AppError('registeredCapital错误')),
            establishmentDate: Joi.string().required().error(new AppError('establishmentDate错误')),
            businessTermBegin: Joi.string().required().error(new AppError('businessTermBegin错误')),
            businessTermEnd: Joi.string().required().error(new AppError('businessTermEnd错误')),
            businessTermEndless: Joi.string().required().error(new AppError('businessTermEndless错误')),
            businessScope: Joi.string().required().error(new AppError('businessScope错误')),
            businessCorporationName: Joi.string().required().error(new AppError('businessCorporationName错误')),
            businessCorporationCredentialType: Joi.number().required().error(new AppError('businessCorporationCredentialType错误')),
            businessCorporationCredentialNum: Joi.string().required().error(new AppError('businessCorporationCredentialNum错误')),
            businessCorporationCredentialNumMobile: Joi.string().required().error(new AppError('businessCorporationCredentialNumMobile错误')),
            businessCorporationCredentialExpireDate: Joi.string().required().error(new AppError('businessCorporationCredentialExpireDate错误')),
            businessCorporationCredentialFrontImageUrl: Joi.string().required().error(new AppError('businessCorporationCredentialFrontImageUrl错误')),
            businessCorporationCredentialBackImageUrl: Joi.string().required().error(new AppError('businessCorporationCredentialBackImageUrl错误')),
            businessLicenseUIageUrl: Joi.string().required().error(new AppError('businessLicenseUIageUrl错误')),
            bankAccountPermitImageUrl: Joi.string().required().error(new AppError('bankAccountPermitImageUrl错误'))
        };
        const userService = new UserService(opts, schema, ctx)
        ctx.body = await userService.register()
    }

    static async login (ctx) {
        log.debug(`session spUid: ${ctx.session.spUid}`)
        const {mobile, loginPassword} = ctx.param
        const opts = {mobile, loginPassword}
        const schema = {
            mobile: Joi.string().required(),
            loginPassword: Joi.string().required().error(new AppError('loginPassword错误'))
        };
        const userService = new UserService(opts, schema, ctx)
        ctx.body = await userService.login()
    }

    static async logout (ctx) {
        ctx.session.spUid = null
        ctx.body = {}
    }
  }
  
  module.exports = User;
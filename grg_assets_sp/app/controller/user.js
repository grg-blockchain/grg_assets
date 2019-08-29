

const { SpInfo } = require('../model')
// const { redis } = require('../../config/initializer')
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
        log.info('register ==>', ctx.param)
        // let jcInfo = await SpInfo.create({ name: "JC", mobile: "123", loginPassword: "122222" })
        // ctx.body = 'ok'
        const {mobile, loginPassword, name} = ctx.param
        const opts = {mobile, loginPassword, name}
        const schema = {
            mobile: Joi.string().required(),
            loginPassword: Joi.string().required().error(new AppError('loginPassword错误')),
            name: Joi.string().required().error(new AppError('name错误'))
        };
        const userService = new UserService(opts, schema, ctx)
        ctx.body = await userService.register()
    }

    static async login (ctx) {
        log.info('login ==>', ctx.param)
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
        log.info('session user 0 =>', ctx.session.user)
        ctx.session.uid = null
        log.info('session user 1 =>', ctx.session.user)
        ctx.body = {}
    }
  }
  
  module.exports = User;
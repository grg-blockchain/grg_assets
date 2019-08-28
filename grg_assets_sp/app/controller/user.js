

const { SpInfo } = require('../model')
const { redis } = require('../../config/initializer')
const { log, AppError } = require('../lib')
const Joi = require('joi')

class User {
    static async info (ctx) {
        // 创建新用户
        // let jcInfo = await SpInfo.create({ username: "JC", email: "641750707@qq.com" })
        log.info('jcInfo ==>', ctx.param)
        // let r = await redis.get('aa')
        // console.log('r ==>', r)
        // ctx.body = {
        //     id: jcInfo.id,
        //     name: jcInfo.username
        // };
        log.info('session user 0 =>', ctx.session.user)
        log.info('session user 1 =>', ctx.session.user)
        ctx.body = {'id': '12321213'}
    }

    static async register (ctx) {
        log.info('jcInfo ==>', ctx.param)
        const schema = {
            mobile: Joi.number().required().integer().error(new AppError('limit有误'))
        };
        ctx.body = {'id': '12321213'}
    }

    static async login (ctx) {
        log.info('login ==>', ctx.param)
        const schema = {
            mobile: Joi.string().required(),
            loginPassword: Joi.string().required().error(new AppError('loginPassword错误'))
        };

        const {error, value} = Joi.validate(ctx.param, schema);
        log.info(`error:${error}, value:${value}`)

        if (error) {
            throw new AppError(error.message, 1);
        }
        log.info('======>', JSON.stringify(value))
        ctx.session.uid = 'xxxxxx'
        ctx.body = {'uid': '000000000000'}
    }

    static async logout (ctx) {
        log.info('session user 0 =>', ctx.session.user)
        ctx.session.uid = null
        log.info('session user 1 =>', ctx.session.user)
        ctx.body = {}
    }
  }
  
  module.exports = User;
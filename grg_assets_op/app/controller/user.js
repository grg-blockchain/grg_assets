

const { SpInfo } = require('../model')
const { log, AppError } = require('../lib')
const Joi = require('joi')
const UserService = require('../service/user');
const _ = require('lodash');
class User {

    static async register (ctx) {
        const {mobile, loginPassword} = ctx.param
        const opts = {mobile, loginPassword}
        const schema = {
            mobile: Joi.string().required(),
            loginPassword: Joi.string().required().error(new AppError('loginPassword错误'))
        };
        const userService = new UserService(opts, schema, ctx)
        ctx.body = await userService.register()
    }

    static async login (ctx) {
        // log.debug(`session spUid: ${ctx.session.spUid}`)
        const {mobile, loginPassword} = ctx.param
        const opts = {mobile, loginPassword}
        const schema = {
            mobile: Joi.string().required().error(new AppError('mobile错误')),
            loginPassword: Joi.string().required().error(new AppError('loginPassword错误'))
        };
        const userService = new UserService(opts, schema, ctx)
        ctx.body = await userService.login()
    }

    // static async checkMobileExist (ctx) {
    //     const {mobile} = ctx.param
    //     const opts = {mobile}
    //     const schema = {
    //         mobile: Joi.string().required().error(new AppError('mobile错误'))
    //     };
    //     const userService = new UserService(opts, schema, ctx)
    //     ctx.body = await userService.checkMobileExist()
    // }

    static async logout (ctx) {
        ctx.session.opUid = null
        ctx.body = {}
    }
  }
  
  module.exports = User;
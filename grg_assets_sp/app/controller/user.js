

const { SpInfo } = require('../model')
const { redis } = require('../../config/initializer')
const { log } = require('../lib')

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
        ctx.body = {'id': '12321213'}
    }

    static async register (ctx) {
        log.info('jcInfo ==>', ctx.param)
        ctx.body = {'id': '12321213'}
    }

    static async login (ctx) {
        log.info('jcInfo ==>', ctx.param)
        ctx.body = {'id': '12321213'}
    }
  }
  
  module.exports = User;
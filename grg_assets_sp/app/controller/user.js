

const { SpInfo } = require('../model')
const { redis } = require('../../config/initializer')

class User {
    static async info (ctx) {
        // 创建新用户
        let jcInfo = await SpInfo.create({ username: "JC", email: "641750707@qq.com" })
        console.log('jcInfo ==>', jcInfo)
        let r = await redis.get('aa')
        console.log('r ==>', r)
        ctx.body = {
            id: jcInfo.id,
            name: jcInfo.username
        };
    }
  }
  
  module.exports = User;
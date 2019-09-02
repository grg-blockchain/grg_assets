const BaseService = require('./base');
const { SpInfo } = require('../model')
const { log } = require('../lib')
class UserService extends BaseService {
    async register () {

        const { mobile } = this.options
        let info = this.options
        const userInfo = await SpInfo.findOne({where :{mobile: mobile}})
        if (userInfo) {
            return '该账号已存在'
        }
        delete info['loginPassword']
        delete info['payPassword']
        const updateData = {
            mobile: mobile,
            loginPassword: this.options.loginPassword,
            payPassword: this.options.payPassword,
            name: this.options.name,
            simpleName: this.options.simpleName,
            spType: this.options.spType,
            info: this.options
        }

        let spInfo = await SpInfo.create(updateData)
        log.debug(`spInfo: ${spInfo}`)

        return spInfo
    }
    async login () {
        const { mobile,loginPassword } = this.options
        const userInfo = await SpInfo.findOne({where :{mobile: mobile, loginPassword: loginPassword}})
        log.debug(`userInfo: ${JSON.stringify(userInfo)}`)
        if (!userInfo) {
            return '账号或者密码错误'
        }
        this.ctx.session.spUid = userInfo.id
        return {spUid: userInfo.id}
    }

    async logout () {
        
    }
}

module.exports = UserService;
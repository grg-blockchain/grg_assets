const BaseService = require('./base')
const { OpInfo } = require('../model')
const { log, AppError } = require('../lib')
class UserService extends BaseService {
    
    async register () {

        const { mobile } = this.options
        let info = this.options
        log.debug(`mobile: ${JSON.stringify(mobile)}`)
        const userInfo = await OpInfo.findOne({where :{mobile: mobile}})
        log.debug(`userInfo: ${JSON.stringify(userInfo)}`)
        if (userInfo && userInfo['mobile']) {
            return '该账号已存在'
        }

        const updateData = {
            mobile: mobile,
            loginPassword: this.options.loginPassword,
            name: this.options.name,
            authority: "admin",
            state: "allow"
        }

        let opInfo = await OpInfo.create(updateData)
        log.debug(`opInfo: ${opInfo}`)

        return '注册成功'
    }
    async login () {
        const { mobile,loginPassword } = this.options
        log.debug(`mobile: ${mobile}`)
        log.debug(`loginPassword: ${loginPassword}`)
        const userInfo = await OpInfo.findOne({where :{mobile: mobile, loginPassword: loginPassword}})
        log.debug(`userInfo: ${JSON.stringify(userInfo)}`)
        if (!userInfo) {
            throw new AppError('账号或者密码错误')
        }
        this.ctx.session.opUid = userInfo.id
        return {opUid: userInfo.id}
    }
}

module.exports = UserService;
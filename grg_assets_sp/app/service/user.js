const BaseService = require('./base')
const { SpInfo } = require('../model')
const { log, AppError } = require('../lib')
class UserService extends BaseService {
    async register () {

        const { mobile } = this.options
        let info = this.options
        log.debug(`mobile: ${JSON.stringify(mobile)}`)
        const userInfo = await SpInfo.findOne({where :{mobile: mobile}})
        log.debug(`userInfo: ${JSON.stringify(userInfo)}`)
        if (userInfo && userInfo['mobile']) {
            return '该账号已存在'
        }
        // delete info['loginPassword']
        // delete info['payPassword']
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

        return '注册成功'
    }
    async login () {
        const { mobile,loginPassword } = this.options
        log.debug(`mobile: ${mobile}`)
        log.debug(`loginPassword: ${loginPassword}`)
        const userInfo = await SpInfo.findOne({where :{mobile: mobile, loginPassword: loginPassword}})
        log.debug(`userInfo: ${JSON.stringify(userInfo)}`)
        if (!userInfo) {
            throw new AppError('账号或者密码错误')
        }
        this.ctx.session.spUid = userInfo.id
        return {spUid: userInfo.id}
    }

    // 0是通过，1是重复，2是电话号码不合法
    async checkMobileExist () {
        const { mobile } = this.options
        log.debug(`mobile: ${JSON.stringify(mobile)}`)
        // var reg= /^((0\d{2,3}-\d{7,8})|(1[3584]\d{9}))$/;
        // console.log('=======>', reg.test(mobile))
        // if(!reg.test(mobile)) {
        //     return 2
        // }

        const userInfo = await SpInfo.findOne({where :{mobile: mobile}})
        if (userInfo && userInfo['mobile']) {
            return 1
        }
        return 0

    }

    async logout () {
        
    }
}

module.exports = UserService;
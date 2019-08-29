const BaseService = require('./base');
const { SpInfo } = require('../model')
class UserService extends BaseService {
    async register () {
        console.log('register==>option==>', this.options)
        let ret = await SpInfo.create(this.options)
        console.log('register==>ret==>', ret)
        return 'ret'
    }
    async login () {
        console.log('================================>0')
        const ret = {
            spUid: '0000001'
        }
        return ret
    }

    async logout () {
        
    }
}

module.exports = UserService;
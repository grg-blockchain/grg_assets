const BaseService = require('./base')
const { SpInfo } = require('../model')
const { log, AppError } = require('../lib')
class SpInfoService extends BaseService {
    
    async list () {
        log.debug(`this.options: ${JSON.stringify(this.options)}`)
        const { opUid } = this.options
        // let query = {}
        let spInfos = await SpInfo.findAll({attributes: {exclude:['loginPassword', 'payPassword']}})
        log.debug(`spInfos: ${JSON.stringify(spInfos)}`)

        if (spInfos) {
            spInfos.forEach(e => {
                delete e.info.loginPassword
                delete e.info.payPassword
            });
        }
        return {spInfos: spInfos}
    }

    async audit () {
        const { spUid, state} = this.options
        let query = {id: spUid}
        let updateData = {
            state: state
        }
        let spInfo = await SpInfo.update(updateData, {where: query})
        log.debug(`spInfos: ${JSON.stringify(spInfo)}`)
        
        return '审核成功'
    }
}

module.exports = SpInfoService;
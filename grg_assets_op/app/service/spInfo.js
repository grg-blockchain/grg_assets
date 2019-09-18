const BaseService = require('./base')
const { SpInfo } = require('../model')
const { log, AppError } = require('../lib')
class SpInfoService extends BaseService {
    
    async list () {
        log.debug(`this.options: ${JSON.stringify(this.options)}`)
        const { opUid } = this.options
        let query = {}
        let spInfos = await SpInfo.findAll({where :query})
        log.debug(`spInfos: ${JSON.stringify(spInfos)}`)

        if (spInfos) {
            spInfos.forEach(e => {
                delete e.loginPassword
                delete e.payPassword
                delete e.info.loginPassword
                delete e.info.payPassword
            });
        }
        return {spInfos: spInfos}
    }
}

module.exports = SpInfoService;
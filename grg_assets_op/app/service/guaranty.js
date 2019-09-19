

const BaseService = require('./base')
const {GuarantyTransaction} = require('../model')
const {log} = require('../lib')

class GuarantyService extends BaseService {
    async list() {
        const {spUid, bank, bankCard} = this.options

        let query = {
            // spUid: spUid
        }

        if(spUid){
            query['spUid'] = spUid
        }

        if(bank){
            query['bank'] = bank
        }

        if(bankCard){
            query['bankCard'] = bankCard
        }

        const transInfos = await GuarantyTransaction.findAll({where: query})

        return {
            sumbitInfo: {
                bank: "中国银行",
                bankCard: "xxxxxxxxxxxxxxxxxx"
                },
            sumbitHistory: transInfos
        }
    }

    async audit() {
        const { spUid, guarantyTransactionId, state } = this.options
        let query = {
            id: guarantyTransactionId,
            spUid: spUid
        }
        let updateData = {
            state: state
        }
        let gTransaction = await GuarantyTransaction.update(updateData, {where: query})
        log.debug(`gTransaction: ${JSON.stringify(gTransaction)}`)
        
        return '审核成功'
    }

}

module.exports = GuarantyService;
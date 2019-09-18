

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

}

module.exports = GuarantyService;
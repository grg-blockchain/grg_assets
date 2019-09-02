

const BaseService = require('./base')
const {GuarantyTransaction} = require('../model')
const {log} = require('../lib')

class GuarantyService extends BaseService {
    async submit() {
        const {spUid, bankCard, serialNumber} = this.options
        const updateData = {
            'spUid': this.options.spUid,
            'bank': this.options.bank,
            'bankCard': this.options.bankCard,
            'serialNumber': this.options.serialNumber,
            'quota': this.options.quota,
            'desc': this.options.desc,
            'state': 'auditing'
        }

        let transInfo = await GuarantyTransaction.findOne({where :{spUid: spUid, bankCard:bankCard, serialNumber: serialNumber}})

        if (transInfo){
            return `流水号: ${serialNumber}已经提交过`
        }
        transInfo = await GuarantyTransaction.create(updateData)
        log.debug(`transInfo=================>: ${transInfo}`)
        return transInfo
        
    }
    async getDetail() {
        const {spUid} = this.options
        const transInfos = await GuarantyTransaction.findAll({where: {spUid: spUid}})

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
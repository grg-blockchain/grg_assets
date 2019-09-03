

const BaseService = require('./base')
const {Asset} = require('../model')
const {log} = require('../lib')

class AssetService extends BaseService {
    async approve() {
        const updateData = {
            'spUid': this.options.spUid,
            'name': this.options.name,
            'expiration': this.options.expiration,
            'price': this.options.price,
            'supply': this.options.supply,
            'desc': this.options.desc,
            'state': 'working'
        }
        const assetInfo = await Asset.create(updateData)
        log.debug(`assetInfo=================>: ${assetInfo}`)
        return assetInfo
    }

    async setSupply() {
        const query = {
            spUid: this.options.spUid,
            id: this.options.assetId
        }
        const updateData = {
            supply: this.options.supply
        }
        log.debug(`setSupply=>query: ${JSON.stringify(query)}`)
        log.debug(`setSupply=>updateData: ${JSON.stringify(updateData)}`)
        const assetInfo = await Asset.update(updateData, {where: query})
        log.debug(`setSupply=>assetInfo: ${assetInfo}`)
        return {}
    }

    async list() {
        const {spUid, name, state} = this.options
        let query = {
            spUid: spUid
        }
        if (name) {
            query['name'] = name
        }

        if (state) {
            query['state'] = state
        }

        log.debug(`query: ${query}`)
        let assets = await Asset.findAll({where: query})
        let ret = []
        assets.forEach(e => {
            ret.push({
                assetId: e.id,
                name: e.name,
                supply: e.supply,
                date: e.createdAt,
                state: e.state
            })
        });

        return {
            assets: ret
        }
    }
    async getDetail() {
        log.debug(`getDetail=>options: ${this.options}`)
        const {spUid, assetId} = this.options
        const query = {
            spUid: spUid,
            id: assetId
        }
        log.debug(`getDetail=>query: ${JSON.stringify(query)}`)
        let assetInfo = await Asset.findOne({where: query})
        let ret = {}
        if (assetInfo) {
            ret = {
                assetId: assetInfo.id,
                date: assetInfo.createdAt,
                name: assetInfo.name,
                supply: assetInfo.supply,
                price: assetInfo.price,
                state: assetInfo.state,
                circulatingSupply: 0,
                circulatingSupply: 0,
                transactionHistory: []
            }
            ret.remainingSupply = ret.supply - ret.circulatingSupply
        }
        log.debug(`getDetail=>ret: ${JSON.stringify(ret)}`)
        return ret
    }
}

module.exports = AssetService;
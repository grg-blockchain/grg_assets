const { OpRecord } = require('../model')
const URL = require('url');
const { log } = require('../lib')
module.exports = async (ctx, next) => {
    url = URL.parse(ctx.originalUrl)
    const record = await OpRecord.create({
        pathname: url.pathname,
        originalUrl: ctx.originalUrl,
        method: ctx.request.method,
        param: ctx.param
    })
    log.info('创建记录：' + JSON.stringify(record))
    await next()
};
const {log} = require('../lib');

module.exports = async (ctx, next) => {
  if (ctx.url.indexOf('healthcheck') > -1) {
    await next();
    return;
  }
  const start = new Date();
  log.info('request', ctx.method, '-', ctx.url, ctx.param);
  await next();
  const ms = new Date() - start;
  log.info('response', ctx.method, '-', ctx.url, `-${ms}ms`, ctx.body, ctx.state.requestId);
};
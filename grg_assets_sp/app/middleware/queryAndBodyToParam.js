const _ = require('lodash');
const uuid = require('uuid');

module.exports = async (ctx, next) => {
  ctx.param = _.extend({}, ctx.query, ctx.request.body);
  ctx.state.requestId = uuid.v4();
  ctx.state.clientIp = ctx.ip.split(':')[3] || ctx.ip;
  await next();
};

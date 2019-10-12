const Joi = require("joi");

module.exports = async (ctx, next) => {
    if (ctx.request.files) {
        files = ctx.request.files
        Object.keys(files).forEach(e => {
            ctx.request.body[e] = files[e]['path']
        });
    }
    ctx.param = _.extend({}, ctx.query, ctx.request.body);
    ctx.state.requestId = uuid.v4();
    ctx.state.clientIp = ctx.ip.split(':')[3] || ctx.ip;
    await next();
};

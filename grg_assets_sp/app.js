const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const session=require('koa-session');
const logger = require('koa-logger')
const http = require('http');
const router = require('./app/router');
const config = require('config');
const port = config.get('port');
const { queryAndBodyToParam } = require('./app/middleware');
require('./config/initializer');

// error handler
onerror(app)

app.keys = ['this is my secret and fuck you all'];//我理解为一个加密的密钥

// middlewares
app.use(session({
  key: 'grg:sess', /** cookie的名称，可以不管 */
  maxAge: 7200000, /** (number) maxAge in ms (default is 1 days)，cookie的过期时间，这里表示2个小时 */
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
},app));

app.use(bodyparser({}))
app.use(json())
app.use(logger())
app.use(queryAndBodyToParam)
// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(router.routes(), router.allowedMethods());
app.listen(3000);
module.exports = app

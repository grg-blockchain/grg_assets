const User = require('./controller/user');
const router = require('koa-router')({prefix: '/api/v1', sensitive: true});
const {opRecord} = require('./middleware')



router.get('/user', opRecord, User.info);

/**
 * 商户注册
 * @api {POST} /users/register 商户注册
 * @apiDescription 商户注册
 * @apiName register
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 * @apiParam {String} name 商户名称
 * @apiParam {String} pay_password 支付密码
 * @apiParam {String} state 账户状态
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "注册成功,请登陆"
 *    }
 * @apiGroup User
*/
router.post('/user/register', opRecord, User.register);


/**
 * 商户登陆
 * @api {POST} /users/login 商户登陆
 * @apiDescription 商户登陆
 * @apiName login
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 *
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0,
 *      "msg": "登陆成功",
 *      "data": {
 *          "userId": "xxxxxxxxxxxxxxxx",
 *          "token": "xxxxxxxxxxxxxxx"
 *      }
 *    }
 * @apiGroup User
 */
router.post('/user/login', opRecord, User.login);

/**
 * @api {POST} /user/guaranty-submit 担保金提交申请
 * @apiDescription 担保金提交申请
 * @apiName guaranty-submit
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "注册成功,请登陆"
 *    }
 * @apiGroup User
 */
router.post('/user/guaranty-submit', opRecord)

/**
 * @api {POST} /token/approve 商户发行数字资产
 * @apiDescription 商户发行数字资产
 * @apiName approve
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "注册成功,请登陆"
 *    }
 * @apiGroup Token
 */
router.post('/token/approve', opRecord)

/**
 * @api {POST} /token/send 商户数字资产发送
 * @apiDescription 商户数字资产发送
 * @apiName send
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "注册成功,请登陆"
 *    }
 * @apiGroup Token
 */
router.post('/token/send', opRecord)

/**
 * @api {POST} /token/receive 商户数字资产接收
 * @apiDescription 商户数字资产接收
 * @apiName receive
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "注册成功,请登陆"
 *    }
 * @apiGroup Token
 */
router.post('/token/receive', opRecord)

/**
 * @api {POST} /token/destory 商户数字资产销户
 * @apiDescription 商户数字资产销户
 * @apiName destory
 * @apiParam {String} mobile 手机号
 * @apiParam {String} login_password 登陆密码
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "注册成功,请登陆"
 *    }
 * @apiGroup Token
 */
router.post('/token/destory', opRecord)



module.exports = router;
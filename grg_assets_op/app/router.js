const User = require('./controller/user');
const Sp = require('./controller/spInfo');
const Guaranty = require('./controller/guaranty');
const Asset = require('./controller/asset');
const router = require('koa-router')({prefix: '/api/v1', sensitive: true});
const {opRecord, ResponseFormatter} = require('./middleware')

router.use('/', ResponseFormatter('^/api'));

// router.get('/user/logout', opRecord, User.logout);

/**
 * 运营注册
 * @api {POST} /user/register 运营注册
 * @apiDescription 运营注册
 * @apiName register
 * @apiParam {String} mobile 手机号
 * @apiParam {String} loginPassword 登陆密码
 * 
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
 * 运营登陆
 * @api {POST} /user/login 运营登陆
 * @apiDescription 运营登陆
 * @apiName login
 * @apiParam {String} mobile 手机号
 * @apiParam {String} loginPassword 登陆密码
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0,
 *      "msg": "登陆成功",
 *      "data": {
 *          "opUid": "xxxxxxxxxxxxxxxx"
 *      }
 *    }
 * @apiGroup User
 */
router.post('/user/login', User.login);

/**
 * @api {GET} /sp/list 商户列表
 * @apiDescription 商户列表
 * @apiName list
 * @apiParam {String} opUid 运营账户ID
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0,
 *      "msg": "登陆成功",
 *      "data": {
 *          "spInfos": [
 *               {
 *                   "id": 1,
 *                   "name": "GRG banking",
 *                   "mobile": "18719460360",
 *                   "simpleName": "GRG",
 *                   "spType": "1",
 *                   "info": {
 *                      "name": "GRG banking",
 *                      "mobile": "18719460360",
 *                      "spType": "1",
 *                      "address": "科林路11号",
 *                      "simpleName": "GRG",
 *                      "establishmentDate": "2019-09-01 10:12:00",
 *                      "registeredCapital": 1000000
 *                   },
 *                   "state": "pass",
 *                   "createdAt": "2019-09-06T00:57:48.000Z",
 *                   "updatedAt": "2019-09-19T06:55:42.000Z"
 *               },
 *               {
 *                   "id": 7,
 *                   "name": "GRG banking",
 *                   "mobile": "18719460361",
 *                   "simpleName": "GRG",
 *                   "spType": "1",
 *                   "info": {
 *                      "name": "GRG banking",
 *                      "mobile": "18719460361",
 *                      "spType": "1",
 *                      "address": "科林路11号",
 *                      "simpleName": "GRG",
 *                      "establishmentDate": "2019-09-01 10:12:00",
 *                      "registeredCapital": 1000000
 *                   },
 *                   "state": null,
 *                   "createdAt": "2019-09-06T01:31:18.000Z",
 *                   "updatedAt": "2019-09-06T01:31:18.000Z"
 *               }
 *      }
 *    }
 * @apiGroup sp
 */
router.get('/sp/list', Sp.list);

/**
 * @api {POST} /sp/audit 商户账户审核
 * @apiDescription 商户账户审核
 * @apiName audit
 * @apiParam {String} opUid 运营账户ID
 * @apiParam {String} spUid 商户ID
 * @apiParam {String} state 商户账户状态 pass:审核通过，fail:审核不通过
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0,
 *      "data": "审核成功"
 *    }
 * @apiGroup sp
 */
router.post('/sp/audit', Sp.audit);



/**
 * @api {GET} /guaranty/list 获取担保金信息和明细
 * @apiDescription 获取担保金信息和明细
 * @apiName list
 * @apiParam {String} opUid 运营user id
 * @apiSuccess {Number} code 0 代表成功，非0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0,
 *      "data": {
 *          "sumbitInfo": {
 *              "bank": "中国银行",
 *              "bankCard": "xxxxxxxxxxxxxxxxxx"
 *          },
 *          "sumbitHistory": [
 *              {
 *                  "spUid": "3",                      //商户id
 *                  "id": "1",                         //担保金记录id
 *                  "bank": "平安银行", 
 *                  "bankCard": "xxxxxxxxxxxxxxxxxx",  //银行卡号码
 *                  "quota": 10000,                    //转账金额，元作为单位
 *                  "date": "2019-09-01 08:00:00",     //转账时间
 *                  "desc": "描述记录",                  //记录描述
 *                  "state": "pass"                    //审核状态，auditing 审核中，pass 审核通过，fail 审核失败
 *              },
 *              {
 *                  "spUid": "3",      
 *                  "id": "2",           
 *                  "bank": "平安银行", 
 *                  "bankCard": "xxxxxxxxxxxxxxxxxx", 
 *                  "quota": 20000, 
 *                  "date": "2019-09-02 08:00:00", 
 *                  "state": "fail"}
 *          ]
 *      }
 *    }
 * @apiGroup Guaranty
 */
router.get('/guaranty/list', Guaranty.list)


/**
 * @api {POST} /guaranty/audit 商户账户审核
 * @apiDescription 商户账户审核
 * @apiName audit
 * @apiParam {String} opUid 运营账户ID
 * @apiParam {String} spUid 商户ID
 * @apiParam {String} guarantyTransactionId 担保金记录id
 * @apiParam {String} state 修改状态，pass:审核通过，fail:审核不通过
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0,
 *      "data": "审核成功"
 *    }
 * @apiGroup Guaranty
 */
router.post('/guaranty/audit', Guaranty.audit);



module.exports = router;
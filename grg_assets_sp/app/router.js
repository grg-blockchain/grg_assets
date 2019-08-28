const User = require('./controller/user');
const router = require('koa-router')({prefix: '/api/v1', sensitive: true});
const {opRecord} = require('./middleware')



// router.get('/user', opRecord, User.info);

/**
 * 商户注册
 * @api {POST} /users/register 商户注册
 * @apiDescription 商户注册
 * @apiName register
 * @apiParam {String} mobile 手机号
 * @apiParam {String} loginPassword 登陆密码
 * @apiParam {String} payPassword 支付密码
 * @apiParam {String} name 商户名称
 * @apiParam {String} address 商户地址
 * @apiParam {String} registeredCapital 注册资金
 * @apiParam {String} establishmentDate 成立日期
 * @apiParam {String} businessTermBegin 营业期限起始日期，若无期限，则为0000-00-00 00:00:00
 * @apiParam {String} businessTermEnd 营业期限结束日期，若无期限，则为0000-00-00 00:00:00
 * @apiParam {String} businessTermEndless 
 * @apiParam {String} businessScope 经营范围
 * @apiParam {String} businessCorporationName 企业法人代表姓名
 * @apiParam {String} businessCorporationCredentialType 企业法人证件类型, 【0】身份证
 * @apiParam {String} businessCorporationCredentialNum 企业法人证件号
 * @apiParam {String} businessCorporationCredentialNumMobile 企业法人联系手机号
 * @apiParam {String} businessCorporationCredentialExpireDate 证件到期时间
 * @apiParam {String} businessCorporationCredentialFrontImageUrl 法人代表证件照（正面）地址
 * @apiParam {String} businessCorporationCredentialBackImageUrl 法人代表证件照（背面）地址
 * @apiParam {String} businessLicenseUIageUrl 营业执照照片地址
 * @apiParam {String} bankAccountPermitImageUrl 银行开户许可证照片地址
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
 * 商户登陆
 * @api {POST} /users/login 商户登陆
 * @apiDescription 商户登陆
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
 *          "userId": "xxxxxxxxxxxxxxxx"
 *      }
 *    }
 * @apiGroup User
 */
router.post('/user/login', opRecord, User.login);


/**
 * @api {GET} /guaranty/getDetail 获取担保金信息和明细
 * @apiDescription 获取担保金信息和明细
 * @apiName getdetail
 * @apiParam {String} spUid 发行商户user id
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
 *              {"bank": "平安银行", "bankCard": "xxxxxxxxxxxxxxxxxx", "quota": 10000, "date": "2019-09-01 08:00:00", "state": "pass"},
 *              {"bank": "平安银行", "bankCard": "xxxxxxxxxxxxxxxxxx", "quota": 20000, "date": "2019-09-02 08:00:00", "state": "fail"}
 *          ]
 *      }
 *    }
 * @apiGroup Guaranty
 */
router.get('/guaranty/getDetail', opRecord)



/**
 * @api {POST} /guaranty/submit 担保金提交申请
 * @apiDescription 担保金提交申请
 * @apiName submit
 * @apiParam {String} spUid 发行商户user id
 * @apiParam {String} bank 转账银行名字
 * @apiParam {String} bankCard 银行卡号
 * @apiParam {String} serialNumber 银行流水
 * @apiParam {Number} quota 转账额度
 * @apiParam {String} desc 备注
 * 
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "提交成功, 等待审核"
 *    }
 * @apiGroup Guaranty
 */
router.post('/guaranty/submit', opRecord)

/**
 * @api {POST} /token/approve 商户发行数字资产
 * @apiDescription 商户发行数字资产
 * @apiName approve
 * @apiParam {String} spUid 发行商户user id
 * @apiParam {String} name 数字资产名字
 * @apiParam {Number} expiration 有效期，用天来计
 * @apiParam {String} desc 资产描述描述
 * @apiParam {Number} supply 发行量
 * @apiParam {Number} price 资产单价
 * @apiParam {String} state 数字资产状态
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "msg": "数字资产发行成功"
 *    }
 * @apiGroup Token
 */
router.post('/token/approve', opRecord)

/**
 * @api {GET} /token/list 获取商户数字资产列表
 * @apiDescription 获取商户数字资产列表
 * @apiName list
 * @apiParam {String} spUid 发行商户user id
 * @apiParam {String} name 数字资产名字
 * @apiParam {String} state 数字资产状态,不填默认全部
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "data": {
 *          "list": [
 *              {"name": "通用电影票", "supply": 10000, "date": "2019-09-01 08:00:00", "state": "", "assetId": "xxxxxxx001"},
 *              {"name": "麦当劳通用券", "supply": 10000, "date": "2019-09-01 08:00:00", "state": "", "assetId": "xxxxxxx002"}
 *          ]
 *      }
 *    }
 * @apiGroup Token
 */
router.get('/token/list', opRecord)


/**
 * @api {GET} /token/:assetId/getDetail 获取商户资产明细
 * @apiDescription 获取商户资产明细
 * @apiName getDetail
 * @apiParam {String} spUid 发行商户user id
 * @apiSuccess {Number} code 0 代表成功，非 0 则表示失败
 * @apiSuccess {String} message  提示信息
 * @apiSuccess {Object} data   返回结果
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "code": 0
 *      "data": {
 *          "name": "通用电影票", 
 *          "supply": 10000, 
 *          "date": "2019-09-01 08:00:00", 
 *          "price": 1, 
 *          "remainingSupply": 5000,
 *          "circulatingSupply": 5000,
 *          "state": "", 
 *          "assetId": "xxxxxxx001",
 *          "transactionHistory": [
 *              
 *          ]
 *      }
 *    }
 * @apiGroup Token
 */
router.get('/token/list', opRecord)


/**
 * @api {POST} /token/send 商户数字资产发送
 * @apiDescription 商户数字资产发送
 * @apiName send
 * @apiParam {String} spUid 发行商户user id
 * @apiParam {String} loginPassword 登陆密码
 * @apiParam {String} assetId 资产id
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
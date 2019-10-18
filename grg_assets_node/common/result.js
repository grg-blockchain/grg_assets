var logger = require('../common/log')("result");
var _instance = null;

function Result() {
    this.err_code = {
        ERR_NULL: 0,
        ERR_UNKNOWN: 1,
        ERR_PARAMS_INVALID: 2,
        ERR_DB_ERROR: 3,
        ERR_ETHER_SET_FAILED: 4,
        ERR_ETHER_GET_FAILED: 5,
        ERR_REDIS_GET_FAILED: 6,
        ERR_REDIS_SET_FAILED: 7,
        ERR_SESSION_SERVER_ERROR: 8,
        ERR_SEESION_TIMEOUT: 9,
        ERR_PARAMS_EMPTY: 10,
        ERR_SIGNATURE_ERROR: 11,

        ERR_WECHAT_API_RETURN_FORMAT:       9998,
        ERR_WECHAT_API_CALL_FAILED:         9999,

        ERR_NOT_DO_BUSINESS:                10000,
        ERR_USERNAME_NOT_EXIST:             10001,
        ERR_MOBILE_NOT_EXIST:               10002,
        ERR_LOGIN_PASSWORD_ERROR:           10003,
        ERR_LOGIN_SIGN_ERROR:               10004,
        ERR_PAY_PASSWORD_ERROR:             10005,
        ERR_USER_ALREADY_EXIST:             10006,
        ERR_MOBILE_ALREADY_REGISTED:        10007,
        ERR_VALIDATE_NUM_INVALID:           10008,
        ERR_USER_NOT_EXIST:                 10009,
        ERR_NEED_LOGIN:                     10010,
        ERR_SELECT_DATA_NOTEXISTS:          10011,
        ERR_CR_NUM_ALREADY_REGISTED:        10012,
        ERR_CR_NUM_NOT_YET_REGISTED:        10013,
        ERR_USER_PAY_CODE_INVALID:          10014,

        ERR_SP_ID_EXIST:                    10100,
        ERR_SP_ID_WAITING_AUDIT:            10101,
        ERR_SP_ID_NOT_EXIST:                10102,
        ERR_SP_SCORE_CONFIG_CONVERT_0:      10103,
        ERR_SP_SCORE_CONFIG_NOT_EXIST:      10104,

        ERR_WECHAT_NEED_LOGIN_AGAIN:        10200,
        ERR_WECHAT_ERR_CODE:                10201,

        ERR_BALANCE_NOT_ENOUGH:             10300,
        ERR_USER_CONVERT_NOT_ENOUGH:        10301,
        ERR_SCORE_INVALID:                  10302,

        ERR_ASSET_IS_NOT_BELONG_YOU:        10400,
        ERR_ASSET_IS_NOT_EXIST:             10401,
        ERR_ASSET_IS_BELONG_YOU:            10402,

        ERR_NO_MORE_TRANS_IN_BLOCK:         10900,
        ERR_NO_MORE_NEW_BLOCK:              10901,
        ERR_TRANS_INVALID:                  10902,
        ERR_NO_TRANS_EXIST:                 10903,
        ERR_NO_SP_USER_SCORE_EXIST:         10904,
        ERR_NO_MORE_RECORDS:                10905,


    };

    this.err_map = {};
    this.err_map[this.err_code.ERR_NULL]                = "" ;
    this.err_map[this.err_code.ERR_UNKNOWN]             = "未知错误。" ;
    this.err_map[this.err_code.ERR_PARAMS_INVALID]      = "参数缺失。";
    this.err_map[this.err_code.ERR_DB_ERROR]            = "数据库操作失败。";
    this.err_map[this.err_code.ERR_ETHER_SET_FAILED]    = "以太坊写入失败。";
    this.err_map[this.err_code.ERR_ETHER_GET_FAILED]    = "以太坊查询失败。";
    this.err_map[this.err_code.ERR_REDIS_GET_FAILED]    = "redis查询失败。";
    this.err_map[this.err_code.ERR_REDIS_SET_FAILED]    = "redis写入失败。";
    this.err_map[this.err_code.ERR_SESSION_SERVER_ERROR]= "session服务器错误。";
    this.err_map[this.err_code.ERR_SEESION_TIMEOUT]     = "session会话已失效" ;
    this.err_map[this.err_code.ERR_PARAMS_EMPTY]        = "必要参数为空，请检查";
    this.err_map[this.err_code.ERR_SIGNATURE_ERROR]     = "签名错误。";

    this.err_map[this.err_code.ERR_NOT_DO_BUSINESS]     = "系统尚未营业，请稍后再来吧~";
    this.err_map[this.err_code.ERR_USERNAME_NOT_EXIST]  = "用户名不存在。";
    this.err_map[this.err_code.ERR_MOBILE_NOT_EXIST]    = "手机号码不存在。";
    this.err_map[this.err_code.ERR_LOGIN_PASSWORD_ERROR]    = "登录密码不正确。";
    this.err_map[this.err_code.ERR_LOGIN_SIGN_ERROR]        = "登录签名不正确。";
    this.err_map[this.err_code.ERR_PAY_PASSWORD_ERROR]      = "支付密码不正确。";
    this.err_map[this.err_code.ERR_USER_ALREADY_EXIST]      = "该用户已存在。";
    this.err_map[this.err_code.ERR_MOBILE_ALREADY_REGISTED] = "手机号码已被注册。";
    this.err_map[this.err_code.ERR_VALIDATE_NUM_INVALID]    = "校验码不正确。";
    this.err_map[this.err_code.ERR_USER_NOT_EXIST]          = "用户不存在。";
    this.err_map[this.err_code.ERR_NEED_LOGIN]              = "请重新登录。";
    this.err_map[this.err_code.ERR_SELECT_DATA_NOTEXISTS]   = "查询数据不存在";
    this.err_map[this.err_code.ERR_CR_NUM_ALREADY_REGISTED] = "证件号码已被注册。";
    this.err_map[this.err_code.ERR_CR_NUM_NOT_YET_REGISTED] = "该证件号码尚未注册。";
    this.err_map[this.err_code.ERR_USER_PAY_CODE_INVALID]   = "用户支付二维码已失效。";

    this.err_map[this.err_code.ERR_SP_ID_EXIST]                 = "该商户已存在（商户的社会信用号重复）。";
    this.err_map[this.err_code.ERR_SP_ID_WAITING_AUDIT]         = "该商户社会信用证号码已经处于审核中。";
    this.err_map[this.err_code.ERR_SP_ID_NOT_EXIST]             = "该商户不存在。";
    this.err_map[this.err_code.ERR_SP_SCORE_CONFIG_CONVERT_0]   = "商户的积分配置错误，比率设置为0。";
    this.err_map[this.err_code.ERR_SP_SCORE_CONFIG_NOT_EXIST]   = "商户还没有开通积分发行。";

    this.err_map[this.err_code.ERR_NO_MORE_TRANS_IN_BLOCK]  = "该区块中没有更多的交易。";
    this.err_map[this.err_code.ERR_NO_MORE_NEW_BLOCK]       = "没有更多的区块。";
    this.err_map[this.err_code.ERR_TRANS_INVALID]           = "无效的交易。";
    this.err_map[this.err_code.ERR_NO_TRANS_EXIST]          = "没有更多的交易。";
    this.err_map[this.err_code.ERR_NO_SP_USER_SCORE_EXIST]  = "没有更多的记录。";
    this.err_map[this.err_code.ERR_NO_MORE_RECORDS]         = "没有更多的记录。";

    this.err_map[this.err_code.ERR_BALANCE_NOT_ENOUGH]          = "账户余额不足。";
    this.err_map[this.err_code.ERR_USER_CONVERT_NOT_ENOUGH]     = "用于兑换的商户积分不足以兑换。";
    this.err_map[this.err_code.ERR_USER_CONVERT_NOT_ENOUGH]     = "用于兑换的商户积分不足以兑换。";
    this.err_map[this.err_code.ERR_SCORE_INVALID]               = "积分值是无效的。";

    this.err_map[this.err_code.ERR_WECHAT_API_RETURN_FORMAT]    = "微信接口返回数据格式错误。";
    this.err_map[this.err_code.ERR_WECHAT_API_CALL_FAILED]      = "调用微信接口失败。";
    this.err_map[this.err_code.ERR_WECHAT_NEED_LOGIN_AGAIN]     = "需要重新登录微信。";
    this.err_map[this.err_code.ERR_WECHAT_ERR_CODE]             = "微信返回失败。";

    this.err_map[this.err_code.ERR_ASSET_IS_NOT_BELONG_YOU]     = "资产不属于你，不能操作。";
    this.err_map[this.err_code.ERR_ASSET_IS_NOT_EXIST]          = "资产不存在";
    this.err_map[this.err_code.ERR_ASSET_IS_BELONG_YOU]         = "资产本来就属于你的";

    this.contract_err_code = [
        "NoError",              //成功标识
        "InvalidAddress",       //非法目标地址
        "InvalidUser",          //非法用户地址
        "InvalidUserFrom",      //积分转赠发起方用户地址非法
        "InvalidUserTo",        //积分转赠接收方用户地址非法
        "InvalidStore",         //非法商户地址
        "InvalidStoreFrom",     //积分兑换发起方商户地址非法
        "InvalidStoreTo",       //积分兑换接收方商户地址非法
        "InvalidNumber",        //非法手机号
        "InvalidChangeRate",    //非法兑换率
        "InvalidHash",          //非法哈希
        "InvalidSign",          //非法签名
        "InvalidTime",          //非法时间
        "InvalidAccount",       //冻结账户
        "RepeatStoreAndUser",   //商户地址不能等于交易发起或接收方用户地址
        "RepeatInAddress",      //交易双方不能为同一地址
        "NotEnoughBalance",     //余额不足
        "BalanceOverFlow",      //余额金额溢出
        "UserTimeOut",          //用户有效期超时
        "UserUnExsist",         //用户不存在
        "InvalidPointsTime",    //积分不在有效时间区间
        "InvalidStoreAccess",   //无效的商户映射关系
    ];

    this.Result = function(result, err_code, err_msg_append) {
        if (err_msg_append == null) {
            err_msg_append = "";
        }
        if (err_code == null || err_code === undefined) {
            err_code = 0;
        }
        else if (this.err_map[err_code] === undefined) {
            err_code = this.err_code.ERR_UNKNOWN;
        }

        result = {error_code: err_code, error_msg:this.err_map[err_code] + ". " + err_msg_append, result: result};
        logger.info("response: " + JSON.stringify(result));
        return result;
    };
    this.makePage = function (arr, page) {
        return {page: page, count: arr.length, list:arr};
    }
}
if (_instance == null) {
    _instance = new Result();
}
module.exports = function () {
    return _instance;
};



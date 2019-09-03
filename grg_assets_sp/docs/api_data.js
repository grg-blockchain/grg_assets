define({ "api": [  {    "type": "POST",    "url": "/asset/approve",    "title": "商户发行数字资产",    "description": "<p>商户发行数字资产</p>",    "name": "approve",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "name",            "description": "<p>数字资产名字</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "expiration",            "description": "<p>有效期，用天来计</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "desc",            "description": "<p>资产描述描述</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "supply",            "description": "<p>发行量</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "price",            "description": "<p>资产单价</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"数字资产发行成功\"\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/approve"      }    ]  },  {    "type": "POST",    "url": "/asset/destory",    "title": "商户数字资产销户",    "description": "<p>商户数字资产销户</p>",    "name": "destory",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "mobile",            "description": "<p>手机号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "login_password",            "description": "<p>登陆密码</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"注册成功,请登陆\"\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/destory"      }    ]  },  {    "type": "GET",    "url": "/asset/getDetail",    "title": "获取商户资产明细",    "description": "<p>获取商户资产明细</p>",    "name": "getDetail",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "assetId",            "description": "<p>资产ID</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Number",            "optional": false,            "field": "code",            "description": "<p>0 代表成功，非 0 则表示失败</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "message",            "description": "<p>提示信息</p>"          },          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "data",            "description": "<p>返回结果</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"data\": {\n      \"name\": \"通用电影票\", \n      \"supply\": 10000,                //发行总量\n      \"date\": \"2019-09-01 08:00:00\",  //发行时间\n      \"price\": 1,                     //单价\n      \"remainingSupply\": 5000,        //剩余量\n      \"circulatingSupply\": 5000,      //流通量\n      \"state\": \"\",                    //资产状态\n      \"assetId\": \"xxxxxxx001\",        //资产ID\n      \"transactionHistory\": [\n          {\n              \"nodeId\": \"xxxxxxxx001\",       //用户id\n              \"date\": \"2019-09-01 08:00:00\"  //交易时间\n              \"num\": 1                       //交易笔数\n          }\n      ]\n  }\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/getDetail"      }    ]  },  {    "type": "GET",    "url": "/asset/list",    "title": "获取商户数字资产列表",    "description": "<p>获取商户数字资产列表</p>",    "name": "list",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "name",            "description": "<p>数字资产名字</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "state",            "description": "<p>数字资产状态,不填默认全部</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"data\": {\n      \"list\": [\n          {\n              \"name\": \"通用电影票\",             //资产名字\n              \"supply\": 10000,                //资产发行量\n              \"date\": \"2019-09-01 08:00:00\",  //资产发行时间\n              \"state\": \"\",                    //资产状态\n              \"assetId\": \"xxxxxxx001\"         //资产ID\n          },\n          {\n              \"name\": \"麦当劳通用券\",\n              \"supply\": 10000,\n              \"date\": \"2019-09-01 08:00:00\",\n              \"state\": \"\",\n              \"assetId\": \"xxxxxxx002\"\n          }\n      ]\n  }\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/list"      }    ]  },  {    "type": "POST",    "url": "/asset/receive",    "title": "商户数字资产接收",    "description": "<p>商户数字资产接收</p>",    "name": "receive",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "mobile",            "description": "<p>手机号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "login_password",            "description": "<p>登陆密码</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"注册成功,请登陆\"\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/receive"      }    ]  },  {    "type": "POST",    "url": "/asset/send",    "title": "商户数字资产发送",    "description": "<p>商户数字资产发送</p>",    "name": "send",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "loginPassword",            "description": "<p>登陆密码</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "assetId",            "description": "<p>资产id</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"注册成功,请登陆\"\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/send"      }    ]  },  {    "type": "POST",    "url": "/asset/setSupply",    "title": "数字资产发行量修改",    "description": "<p>数字资产发行量修改</p>",    "name": "setSupply",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "assetId",            "description": "<p>资产ID</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "supply",            "description": "<p>发行量</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"发行量修改成功\"\n}",          "type": "json"        }      ]    },    "group": "Asset",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Asset",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/asset/setSupply"      }    ]  },  {    "type": "GET",    "url": "/guaranty/getDetail",    "title": "获取担保金信息和明细",    "description": "<p>获取担保金信息和明细</p>",    "name": "getdetail",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Number",            "optional": false,            "field": "code",            "description": "<p>0 代表成功，非0 则表示失败</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "message",            "description": "<p>提示信息</p>"          },          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "data",            "description": "<p>返回结果</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0,\n  \"data\": {\n      \"sumbitInfo\": {\n          \"bank\": \"中国银行\",\n          \"bankCard\": \"xxxxxxxxxxxxxxxxxx\"\n      },\n      \"sumbitHistory\": [\n          {\n              \"bank\": \"平安银行\", \n              \"bankCard\": \"xxxxxxxxxxxxxxxxxx\",  //银行卡号码\n              \"quota\": 10000,                    //转账金额，元作为单位\n              \"date\": \"2019-09-01 08:00:00\",     //转账时间\n              \"state\": \"pass\"                    //审核状态\n          },\n          {\n              \"bank\": \"平安银行\", \n              \"bankCard\": \"xxxxxxxxxxxxxxxxxx\", \n              \"quota\": 20000, \n              \"date\": \"2019-09-02 08:00:00\", \n              \"state\": \"fail\"}\n      ]\n  }\n}",          "type": "json"        }      ]    },    "group": "Guaranty",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Guaranty",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/guaranty/getDetail"      }    ]  },  {    "type": "POST",    "url": "/guaranty/submit",    "title": "担保金提交申请",    "description": "<p>担保金提交申请</p>",    "name": "submit",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "bank",            "description": "<p>转账银行名字</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "bankCard",            "description": "<p>银行卡号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "serialNumber",            "description": "<p>银行流水</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "quota",            "description": "<p>转账额度</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "desc",            "description": "<p>备注</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Number",            "optional": false,            "field": "code",            "description": "<p>0 代表成功，非 0 则表示失败</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "message",            "description": "<p>提示信息</p>"          },          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "data",            "description": "<p>返回结果</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"提交成功, 等待审核\"\n}",          "type": "json"        }      ]    },    "group": "Guaranty",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Guaranty",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/guaranty/submit"      }    ]  },  {    "type": "GET",    "url": "/transaction/list",    "title": "获取交易列表",    "description": "<p>获取交易列表</p>",    "name": "list",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spUid",            "description": "<p>发行商户user id</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "name",            "description": "<p>资产名字，可不填</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "assetId",            "description": "<p>资产ID，可不填</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "startDate",            "description": "<p>交易时间段，可不填</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "endDate",            "description": "<p>交易时间段，可不填</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Number",            "optional": false,            "field": "code",            "description": "<p>0 代表成功，非 0 则表示失败</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "message",            "description": "<p>提示信息</p>"          },          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "data",            "description": "<p>返回结果</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"data\": {\n      \"transactionHistory\": [\n          {\n              \"assetId\": \"xxxxxxxxxxxx\"      //资产id\n              \"name\": \"通用电影票\",            //资产名字\n              \"nodeId\": \"xxxxxxxx001\",       //用户id\n              \"date\": \"2019-09-01 08:00:00\"  //交易时间\n              \"num\": 1,                      //交易笔数\n              \"type\": \"send\"                //交易类型 send: 商户发送给用户，receive: 用户消费兑换\n          }\n      ]\n  }\n}",          "type": "json"        }      ]    },    "group": "Transaction",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "Transaction",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/transaction/list"      }    ]  },  {    "type": "POST",    "url": "/users/login",    "title": "商户登陆",    "description": "<p>商户登陆</p>",    "name": "login",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "mobile",            "description": "<p>手机号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "loginPassword",            "description": "<p>登陆密码</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Number",            "optional": false,            "field": "code",            "description": "<p>0 代表成功，非 0 则表示失败</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "message",            "description": "<p>提示信息</p>"          },          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "data",            "description": "<p>返回结果</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0,\n  \"msg\": \"登陆成功\",\n  \"data\": {\n      \"spUid\": \"xxxxxxxxxxxxxxxx\"\n  }\n}",          "type": "json"        }      ]    },    "group": "User",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "User",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/users/login"      }    ]  },  {    "type": "POST",    "url": "/users/register",    "title": "商户注册",    "description": "<p>商户注册</p>",    "name": "register",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "mobile",            "description": "<p>手机号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "loginPassword",            "description": "<p>登陆密码</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "payPassword",            "description": "<p>支付密码</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "name",            "description": "<p>商户名称</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "spId",            "description": "<p>社会信用证号码</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "simpleName",            "description": "<p>商户简称</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "spType",            "description": "<p>企业类型。【1】股份有限公司【2】有限责任公司</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "address",            "description": "<p>商户地址</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "registeredCapital",            "description": "<p>注册资金</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "establishmentDate",            "description": "<p>成立日期</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessTermBegin",            "description": "<p>营业期限起始日期，若无期限，则为0000-00-00 00:00:00</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessTermEnd",            "description": "<p>营业期限结束日期，若无期限，则为0000-00-00 00:00:00</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessTermEndless",            "description": ""          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessScope",            "description": "<p>经营范围</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessCorporationName",            "description": "<p>企业法人代表姓名</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "businessCorporationCredentialType",            "description": "<p>企业法人证件类型, 【0】身份证</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessCorporationCredentialNum",            "description": "<p>企业法人证件号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessCorporationCredentialNumMobile",            "description": "<p>企业法人联系手机号</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessCorporationCredentialExpireDate",            "description": "<p>证件到期时间</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessCorporationCredentialFrontImageUrl",            "description": "<p>法人代表证件照（正面）地址</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessCorporationCredentialBackImageUrl",            "description": "<p>法人代表证件照（背面）地址</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "businessLicenseUIageUrl",            "description": "<p>营业执照照片地址</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "bankAccountPermitImageUrl",            "description": "<p>银行开户许可证照片地址</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Number",            "optional": false,            "field": "code",            "description": "<p>0 代表成功，非 0 则表示失败</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "message",            "description": "<p>提示信息</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"code\": 0\n  \"msg\": \"注册成功,请登陆\"\n}",          "type": "json"        }      ]    },    "group": "User",    "version": "0.0.0",    "filename": "app/router.js",    "groupTitle": "User",    "sampleRequest": [      {        "url": "http://localhost:3000/api/v1/users/register"      }    ]  }] });

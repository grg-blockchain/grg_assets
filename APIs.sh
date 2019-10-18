
1	接口格式说明：
请求：使用restful风格的请求路径，尽量都使用post方式，post参数使用json字符串格式。
响应：第一级格式为：
{
	error_code: 错误码数字，10000以下为系统错误码，10000及以上为业务错误码。
	error_msg: 错误信息描述，字符串。
	result: 业务数据，json字符串格式
}
接收到接口响应数据后，检查error_code是否为0
如果为0，再去使用result中的业务数据。

以下为公共错误码：
错误码	描述
1	未知错误
2	内部错误（可能是网络等错误，建议重试）
3	参数缺失
4	签名校验错误
10000	需要重新登录
10001	时间过于久远
10002	用户被冻结


2	接口签名说明：
每个接口都有一个字段signature，存放签名。
先将各个接口的参数按照顺序拼接起来，登录商户web端查看获取密钥和初始向量（目前还没有放到商户web端），对拼接的明文进行加密，之后对密文做sha1算法进行签名。

选型：
-	对称加密使用的算法为 AES-128-CBC，数据采用PKCS#7填充，采用128位16个字节的aeskey。
-	在商户web端获取到的aeskey和初始向量，是已经Base64_Encode处理过的，处理方法是：：
		Base64_Encode（对称密钥aeskey）
		Base64_Encode（初始向量iv）

所以加密前先Base64_Decode，得到密钥和初始向量。
-	对于加密后的密文，以16进制大写字母表示，再应用sha1算法得到hash值，作为签名。hash值也采用16进制大写字母。


举例：
原始key："9vApxLk5G3PAsJrM"
原始iv："FnJL7EDzjqWjcaY9"

经bese64 encode之后：
base64编码的key：OXZBcHhMazVHM1BBc0pyTQ==
base64编码的iv：Rm5KTDdFRHpqcVdqY2FZOQ==

以上经编码后的key和iv放在商户web端某个页面上。
商户登录后获取它们。

签名时，对base64编码的key和iv进行base64解码，得到原始key和iv
原始key："9vApxLk5G3PAsJrM"
原始iv："FnJL7EDzjqWjcaY9"

用得到的原始key和iv来加密，加密的密文输出为hex格式字母全大写。
比如消息原文："hello world."
加密后的密文：“8B9F0F02161D3C9CA377627B37E97BC1”
加密的细节：nodejs这边用的程序接口需要填写两个参数：输入消息编码选择utf8，输出密文格式选择hex。

之后应用sha1的hash算法，对密文进行hash，得到字母全大写的hax格式。
密文的hash：“16388D5912964DAA20A4F2A7B6D0AB247988B1D9”


3	服务端用户接口

3.1	用户端 - 微信登录
url: /wechart/login
post参数：
-	code string 微信的认证码
返回：
-	key 代表本次登陆的对称密钥key
-	iv 代表本次登陆的密钥的iv
-	need_set_pay_password 需要设置支付密码，应该缓存在前端，当需要操作资产时，先插入设置支付密码的流程
-	need_set_mobile 需要补充手机号，应该紧接着向用户索取授权，获取用户微信资料。

示例：
输入：{"code":"081q03KO15xeh91kYxKO1jXRJO1q03Ki"}
返回：
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"session_id": "DqS39gbw4r5WALHc6zCh5XJUZYR7IhU0",
		"key": "eXpDeWlDNGRQenpRblBsbw==",
		"iv": "VENMOFRzZm1uN1ZKaDlUQw==",
		"need_set_pay_password": 1,
		"need_set_mobile": 1
	}
}


3.2	用户端 - 获取用户微信资料
url: /wechart/register_info
post参数：
-	encrypted_data string微信服务器返回的加密数据
-	iv string 微信服务器返回的加密数据配对的iv
返回：
-	解密后的数据。
示例：
输入：	
{
	"encrypted_data":"UeXIFBDEbE0r8g61BNO2eC8RfipHytpYGwRYesvJCtR6sWqTwkUj8xYDIOr2VVHeaCNx/UAf1KRMcqk3cwIexQk9+ab1sPMXfuIIGmgck0p1TBgbaJEpRuNwoh6P+K2OpLkTwccKG1QWoF9B+VdP2J4Aso7tu4J1C0yFaVMLQY+jwFPMm1bc1UE7lqI8IUXpj3n1kffi1lSpU2gEo8d+dQ==",
	"iv":"9to2GNN5uw5GUKcrhuBzgw=="
}
返回：
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"wechat_info": {
			"phoneNumber": "13560106288",
			"purePhoneNumber": "13560106288",
			"countryCode": "86",
			"watermark": {
				"timestamp": 1567130779,
				"appid": "wx03fc0fbc1e0ba9b6"
			}
		}
	}
}


3.3	用户端 - 查询自己持有的资产的列表
url: /user_assets/query_assets_list
post参数：
-	type string 资产类型，选填（可选值：film）
返回：
	数组，每一个元素包含以下属性
-	mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '用户手机号',
-	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '发行商户的id',
-	assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产id',
-	balance INT NOT NULL DEFAULT 0 COMMENT '资产余额',
-	price INT NOT NULL DEFAULT 0 COMMENT '资产价值',
-	description TEXT COMMENT '资产说明',
-	type 资产类型（可选值：film）
-	icon_image_url VARCHAR(256) NOT NULL DEFAULT '' COMMENT '资产的图标',
-	expire_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '过期时间',
-	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
-	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',
example:
{
	"error_code": 0,
	"error_msg": ". ",
	"result": [{
		"id": 1,
		"mobile": "13661631812",
		"sp_id": "999",
		"sp_type": 0,
		"name": "星际穿越",
		"type": "film",
		"balance": 1,
		"description": "{\"cinema\":\"飞扬影城\",\"address\":\"天河城三楼\",\"time\":\"2019-10-16 20:00:00\",\"hall\":\"3D max厅\",\"row\":5,\"seat\":10}",
		"expire_time": "2019-10-16 20:00:00",
		"create_time": "1970-01-01 00:00:00",
		"update_time": "1970-01-01 00:00:00"
	}, {
		"id": 2,
		"mobile": "13661631812",
		"sp_id": "999",
		"sp_type": 0,
		"name": "星球大战-原力觉醒",
		"type": "film",
		"balance": 1,
		"description": "{\"cinema\":\"飞扬影城\",\"address\":\"天河城三楼\",\"time\":\"2019-10-16 20:00:00\",\"hall\":\"3D max厅\",\"row\":5,\"seat\":10}",
		"expire_time": "2019-10-16 20:00:00",
		"create_time": "1970-01-01 00:00:00",
		"update_time": "1970-01-01 00:00:00"
	}, {
		"id": 3,
		"mobile": "13661631812",
		"sp_id": "999",
		"sp_type": 0,
		"name": "流浪地球",
		"type": "film",
		"balance": 1,
		"description": "{\"cinema\":\"飞扬影城\",\"address\":\"天河城三楼\",\"time\":\"2019-10-16 20:00:00\",\"hall\":\"3D max厅\",\"row\":5,\"seat\":10}",
		"expire_time": "2019-10-16 20:00:00",
		"create_time": "1970-01-01 00:00:00",
		"update_time": "1970-01-01 00:00:00"
	}, {
		"id": 4,
		"mobile": "13661631812",
		"sp_id": "999",
		"sp_type": 0,
		"name": "霍比特人",
		"type": "film",
		"balance": 1,
		"description": "{\"cinema\":\"飞扬影城\",\"address\":\"天河城三楼\",\"time\":\"2019-10-16 20:00:00\",\"hall\":\"3D max厅\",\"row\":5,\"seat\":10}",
		"expire_time": "2019-10-16 20:00:00",
		"create_time": "1970-01-01 00:00:00",
		"update_time": "1970-01-01 00:00:00"
	}]
}
	
3.4	用户端 - 设置支付密码
url: /user_account/set_pay_password
post参数：
-	pay_password string '支付密码，用sha1和base64编码之后的值',
-	query_time string 请求时间，格式："2019-07-17 00:00:00"
-	signature string签名，原文：pay_password 拼接 query_time，然后用key和iv加密，并sha1得到hash值。
返回：
无

3.6	用户端 - 转赠资产
url: /user_assets/transfer
post参数：
-	asset_id string 支付的资产id
-	mobile string '资产收款方用户手机号', 
-	extern_info string '额外信息，用于存储外部商户对于该交易的描述',
-	pay_password string支付密码，用sha1和base64编码之后的值
-	query_time string 请求时间，"2019-07-17 00:00:00"
-	signature string 签名，原文：asset_id 拼接 payee_user_mobile 拼接 extern_info 拼接 pay_password 拼接 query_time，然后用key和iv加密，并sha1得到hash值。
返回：无


3.7	用户端 - 查询交易列表
url: /user_trans/query_list
post参数：
-	from_time string 开始时间，选填
-	to_time string 结束时间，选填
-	sp_id string 商户id，选填
-	order_by_desc string【true】按时间倒排，选填
-	type  int 【1】给用户发放资产【2】用户消费资产【3】商户代扣用户消费资产【4】用户转赠资产，选填
-	state  int '交易结果：【0】交易失败，【1】交易成功', ，选填
-	page int 第几页，选填
-	count int 每页条目个数，选填
返回：
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"page": 0,
		"count": 1,
		"list": [{
			"id": 66,
			"payer_user_mobile": "15177317536",
			"payer_sp_id": "0",
			"payee_sp_id": "0000000000000101",
			"payee_user_mobile": "",
			"asset_id": "343245",
			"asset_amount": "-1",
			"fee": 0,
			"type": 4,
			"state": 1,
			"state_msg": "",
			"extern_info": "我在北京西二旗辉煌国际分店吃肯德基",
			"create_time": "2019-06-13 10:45:39",
			"payer_sp_simple_name": null,
			"payer_sp_asset_name": "运通利是",
			"payer_sp_asset_icon_image_url": "http://yuntonglishi",
			"payer_sp_convert_ratio": 100,
			"payee_sp_simple_name": "肯德基",
			"payee_sp_asset_name": "肯德基资产",
			"payee_sp_asset_icon_image_url": "url",
			"payee_sp_convert_ratio": 100,

			"relate_sp_simple_name": "肯德基",
			"relate_user_mobile": "15177317536"
		}]
	}
}


3.8	用户端 - 资产交易统计接口
url: /user_trans/stats
post参数：
-	from_time string 开始时间，选填
-	to_time string 结束时间，选填
-	sp_id string 商户id，选填
-	type int '【1】给用户发放资产【2】用户消费资产【3】商户代扣用户消费资产【4】用户转赠资产，选填'
-	state int '交易结果：【0】交易失败，【1】交易成功，选填'
	
返回：
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"income": 0,
		"outcome": "-126"
	}
}


3.9	用户端 - 生成支付二维码
url: 二维码中包含一串json格式的字符串：
以下是示例：
{
	"mobile": "13661631812", 
	"query_time": "2019-06-28 00:00:00",
	"signature": "xxxxxxxxxxx"
}

3.10	用户端 - 商城首页

url: /mall/index
post参数：
返回：
banners 数组中包含n个元素，每个元素里包含：
-	img_url: string 图片地址
-	query_url: string 点击图片后请求的地址
-	desc string 描述,

new_assets 数组中包含n个元素，每个元素里包含：
-	img_url: string图片地址
-	query_url: string点击图片后请求的地址
-	desc string描述,

hot_assets 数组中包含n个元素，每个元素里包含：
-	img_url: string图片地址
-	query_url: string点击图片后请求的地址
-	desc string描述,
example:
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"banners": [{
			"img_url": "images/f1.jpg",
			"query_url": "",
			"desc": "星际穿越"
		}, {
			"img_url": "images/f2.jpg",
			"query_url": "",
			"desc": "星球大战-原力觉醒"
		}, {
			"imgs/f3.jpg",
			"query_url": "",
			"desc": "流浪地球"
		}, {
			"img_url": "images/f4.jpg",
			"query_url": "",
			"desc": "霍比特人"
		}],
		"new_assets": [{
			"img_url": "images/f1.jpg",
			"query_url": "",
			"desc": "星际穿越"
		}, {
			"img_url": "images/fy_url": "",
			"desc": "星球大战-原力觉醒"
		}, {
			"img_url": "images/f3.jpg",
			"query_url": "",
			"desc": "流浪地球"
		}, {
			"img_url": "images/f4.jpg",
			"query_url": "",
			"desc": "霍比特人"
		}],
		"hot_assets": [{
			"img_url": "images/f1.jpg"
			"desc": "星际穿越"
		}, {
			"img_url": "images/f2.jpg",
			"query_url": "",
			"desc": "星球大战-原力觉醒"
		}, {
			"img_url": "images/f3.jpg",
			"query_url": "",
			"desc": "流浪地球"
		}, {
			"img_url": "images/f4.jpg",
			"query_url": "",
			"desc": "霍比特人"
		}]
	}
}

3.11	用户端 – 电影 – 搜索影城
url: /film/query_cinema
post参数：
-	longitude string经度，选填（未实现）
-	latitude string纬度，选填（未实现）
-	film_name string电影名字，选填
返回：
	返回map，key：
-	cinema_id string影城id
-	cinema_name string影城名字
-	longitude string经度
-	latitude string纬度
-	address string影城地址
example:
input: film_name="星际穿越"
output:
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"飞扬影城天河城店": {
			"address": "天河城三楼",
			"assets_id": [5]
		},
		"广州百丽宫影城天环店": {
			"address": "天河路天环广场地下一层",
			"assets_id": [9]
		}
	}
}

3.12	用户端 – 电影 – 搜索电影票
url: /film/query_ticket
post参数：
-	cinema_name string影城name
-	film_name string电影名字
返回：
	数组，每一个元素包含以下属性
-	mobile string '用户手机号',
-	sp_id string '发行商户的id',
-	sp_type int '资产发行者，【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
-	name： 资产名字，这里为电影名字
-	balance int '资产余额',
-	price float '资产价值',
-	type string 资产类型（可选值：film）
-	image_url string '资产的图标',
-	expire_time datetime '过期时间',
-	create_time datetime '创建时间',
-	update_time datetime '修改时间',
example:
input：cinema_name="广州百丽宫影城天环店", film_name="星际穿越"
output:
{
	"error_code": 0,
	"error_msg": ". ",
	"result": {
		"10月16日": {
			"20:00": [{
				"id": 9,
				"mobile": "13661631812",
				"sp_id": "999",
				"sp_type": 0,
				"name": "星际穿越",
				"type": "film",
				"balance": 1,
				"description": {
					"cinema": "广州百丽宫影城天环店",
					"address": "天河路天环广场地下一层",
					"time": "2019-10-16 20:00:00",
					"hall": "3D max厅",
					"row": 5,
					"seat": 10
				},
				"expire_time": "2019-10-16 20:00:00",
				"create_time": "1970-01-01 00:00:00",
				"update_time": "1970-01-01 00:00:00",
				"price": 0,
				"image_url": ""
			}]
		}
	}
}


3.13	用户端 – 商城 – 挂售资产
url: /mall/sale
post参数：
-	sale_list json数组 挂售资产列表，每个元素都有如下字段：
		asset_id string资产id
		price string资产价格
返回：无

3.14	用户端 – 商城 – 查询我挂售的资产
url: /mall/sale_list
post参数：
-	sp_id string '发行商户的id，选填'
-	sp_type int '资产发行者，选填.【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
返回：
	数组，每一个元素包含以下属性

-	sp_id string '发行商户的id',
-	sp_type int '资产发行者，选填.【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
-	name string '资产名字，这里为电影名字', 
-	type string 资产类型（可选值：film）
-	balance int '资产余额',
-	price float '资产价值',
-	description string '资产说明',
-	image_url string '资产的图标',
-	expire_time datetime '过期时间',
-	create_time datetime '创建时间',
-	update_time datetime '修改时间',
example:
input:
{
    sp_id: "13661631812",
    sp_type: 1,
}
output:
{
	"error_code": 0,
	"error_msg": ". ",
	"result": [{
		"id": 3,
		"sp_id": "13661631812",
		"sp_type": 1,
		"name": "星际穿越",
		"type": "film",
		"balance": 1,
		"price": 10,
		"description": "{\"cinema\":\"飞扬影城天河城店\",\"address\":\"天河城三楼\",\"time\":\"2019-10-16 20:00:00\",\"hall\":\"3D max厅\",\"row\":5,\"seat\":10}",
		"image_url": "",
		"expire_time": "2019-10-16 20:00:00",
		"create_time": "2019-10-18 11:37:32",
		"update_time": "2019-10-18 11:37:32"
	}, {
		"id": 4,
		"sp_id": "13661631812",
		"sp_type": 1,
		"name": "星球大战-原力觉醒",
		"type": "film",
		"balance": 1,
		"price": 20,
		"description": "{\"cinema\":\"飞扬影城天河城店\",\"address\":\"天河城三楼\",\"time\":\"2019-10-16 20:00:00\",\"hall\":\"3D max厅\",\"row\":5,\"seat\":10}",
		"image_url": "",
		"expire_time": "2019-10-16 20:00:00",
		"create_time": "2019-10-18 11:37:32",
		"update_time": "2019-10-18 11:37:32"
	}]
}

3.15	用户端 – 商城 – 下架资产
url: /mall/off_sale
post参数：
-	off_sale_list json数组，每个元素都是一个asset_id。
返回：无



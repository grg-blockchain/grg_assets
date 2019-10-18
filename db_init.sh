#!/bin/sh

mysql_user="grg_assets"
mysql_passwd="grg_assets_wG1sOp23sL"
mysql_db="grg_assets"
# CREATE USER $mysql_user IDENTIFIED BY $mysql_passwd;
# CREATE DATABASE $mysql_db;
# GRANT ALL PRIVILEGES ON $mysql_db.* TO "$mysql_user"@"%" ;
# FLUSH PRIVILEGES;

line=`cat grg_assets_node/config.js | grep -n "db: {" | awk -F ':' '{print $1}'`;
let line=line+1;
line=`sed -n "$line"p grg_assets_node/config.js`;
host=`echo $line | awk -F"'" '{print $2}'`;

mysql -h$host -u$mysql_user -p$mysql_passwd -s -e "drop database $mysql_db;";
mysql -h$host -u$mysql_user -p$mysql_passwd -s -e "CREATE DATABASE IF NOT EXISTS $mysql_db;";


echo "create t_operate_global_config";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_operate_global_config (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id',
	config_key VARCHAR(64) NOT NULL COMMENT '配置项名字',
	config_value_int INT(10) NOT NULL DEFAULT 0 COMMENT '配置项整数值',
	config_value_str VARCHAR(256) NOT NULL COMMENT '配置项字符串值',

	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX uidx_config_key(config_key)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_operate_token_rule";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_operate_assets_rule (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id ',
	rule_key VARCHAR(64) NOT NULL COMMENT '配置项名字',
	rule_value_int INT(10) NOT NULL DEFAULT 0 COMMENT '配置项整数值',
	rule_description VARCHAR(256) NOT NULL COMMENT '资产运营规则说明',

	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX uidx_rule_key(rule_key)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_user_openid_info";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_user_openid_info (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id ',
	type INT(1) NOT NULL DEFAULT '1' COMMENT '第三方账户类型。【1】微信',
	openid VARCHAR(64) NOT NULL DEFAULT '' COMMENT '第三方账户openid',
	session_key VARCHAR(64) NOT NULL DEFAULT '' COMMENT '第三方账户登陆后的会话session',
	mobile VARCHAR(32) NOT NULL DEFAULT '' COMMENT '手机号',
	info TEXT COMMENT '第三方账户用户信息',

	state INT(1) NOT NULL DEFAULT 1 COMMENT '状态。【1】正常，【2】停用。',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX uidx_openid_type(openid, type)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_user_account";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_user_account (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id ',
	mobile VARCHAR(32) NOT NULL DEFAULT '' COMMENT '手机号',
	nick VARCHAR(32) NOT NULL DEFAULT '' COMMENT '昵称',
	pay_password VARCHAR(64) NOT NULL DEFAULT '' COMMENT '支付密码',
	aes_key VARCHAR(256) NOT NULL  DEFAULT '' COMMENT '对称密钥',
	state INT(1) NOT NULL DEFAULT 1 COMMENT '状态。【1】正常，【2】冻结。',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',
	PRIMARY KEY (id),
	UNIQUE INDEX uidx_mobile(mobile)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "INSERT INTO t_node_user_account (mobile, nick) value ('13666666666', '13666666666');";


echo "create t_sp_info";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_sp_info (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '社会信用证号码',
	name VARCHAR(64) NOT NULL DEFAULT '' COMMENT '商户名称',
	simple_name VARCHAR(64) NOT NULL DEFAULT '' COMMENT '商户简称',
	sp_type INT(1) NOT NULL DEFAULT 1 COMMENT '企业类型。【1】股份有限公司【2】有限责任公司',
	mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '手机号码',
	login_password VARCHAR(64) NOT NULL DEFAULT '' COMMENT '登陆密码',
	pay_password VARCHAR(64) NOT NULL DEFAULT '' COMMENT '支付密码',

	info TEXT NOT NULL COMMENT '商户信息。json字符串格式',
			#address VARCHAR(256) NOT NULL DEFAULT '' COMMENT '商户地址',
			#mobile VARCHAR(32) NOT NULL DEFAULT '' COMMENT '商户联系号码',
			#registered_capital INT(10) NOT NULL DEFAULT 0 COMMENT '注册资金',
			#establishment_date DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '成立日期',
			#business_term_begin DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '营业期限起始日期，若无期限，则为0000-00-00 00:00:00',
			#business_term_end DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '营业期限结束日期，若无期限，则为0000-00-00 00:00:00',
			#business_term_endless INT(1) NOT NULL DEFAULT 0 COMMENT '【0】非长期，此时business_term_begin,business_term_end有效。【1】长期，此时business_term_begin,business_term_end无效',
			#business_scope VARCHAR(256) NOT NULL DEFAULT '' COMMENT '经营范围',
			#cr_name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '企业法人代表姓名',
			#cr_cert_type INT(1) NOT NULL DEFAULT 0 COMMENT '企业法人证件类型, 【0】身份证',
			#cr_cert_num VARCHAR(32) NOT NULL DEFAULT '' COMMENT '企业法人证件号',
			#cr_mobile VARCHAR(32) NOT NULL DEFAULT '' COMMENT '企业法人联系手机号',
			#cr_cert_expire_date DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '证件到期时间',
			#cr_cert_front_image_url VARCHAR(256) NOT NULL  DEFAULT '' COMMENT '法人代表证件照（正面）地址',
			#cr_cert_back_image_url VARCHAR(256) NOT NULL  DEFAULT '' COMMENT '法人代表证件照（背面）地址',
			#business_license_image_url VARCHAR(256) NOT NULL  DEFAULT '' COMMENT '营业执照照片地址',
			#bank_account_permit_image_url VARCHAR(256) NOT NULL  DEFAULT '' COMMENT '银行开户许可证照片地址',

	# aes_key VARCHAR(256) NOT NULL  DEFAULT '' COMMENT '对称密钥',
	state INT(1) NOT NULL DEFAULT 1 COMMENT '状态。【1】正常，【2】被冻结。',
	create_time DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX uidx_sp_id(sp_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";


echo "create t_sp_assets";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_sp_assets (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产发行者商户id',
	sp_type INT(1) NOT NULL DEFAULT 0 COMMENT '资产发行者手机号，【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
	name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '数字资产名字',
	expiration INT(4) NOT NULL DEFAULT 24 COMMENT '有效期，用月来计',
	description VARCHAR(128) NOT NULL DEFAULT '' COMMENT '描述',
	price INT NOT NULL DEFAULT 0 COMMENT '1单位资产价值',
	supply INT NOT NULL DEFAULT 0 COMMENT '总发行量',
	state VARCHAR(64) NOT NULL DEFAULT '' COMMENT '状态。【0】停用（不能再发放这种资产），【1】正常',
	type VARCHAR(64) NOT NULL DEFAULT '' COMMENT '数字资产类型。【film】电影票',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX uidx_sp_id(sp_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";


echo "create t_guaranty_transaction";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_guaranty_transaction (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '社会信用证号码',
	bank VARCHAR(64) NOT NULL DEFAULT '' COMMENT '银行名字',
	bankcard VARCHAR(64) NOT NULL DEFAULT '' COMMENT '银行卡号',
	serial_number VARCHAR(64) NOT NULL DEFAULT '' COMMENT '流水号',
	quota INT NOT NULL DEFAULT 0 COMMENT '转账金额',
	description VARCHAR(128) NOT NULL DEFAULT '' COMMENT '描述',
	state VARCHAR(64) NOT NULL DEFAULT '' COMMENT '状态',

	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX uidx_sp_id(sp_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_op_info";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_op_info (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增主键id',
	name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '用户名',
	mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '手机号码',
	login_password VARCHAR(64) NOT NULL DEFAULT '' COMMENT '登陆密码',
	authority VARCHAR(64) NOT NULL DEFAULT '' COMMENT '账户权限',
	state VARCHAR(64) NOT NULL DEFAULT '' COMMENT '账户状态',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_user_assets";
# 记录用户持有的数字资产余额
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_user_assets (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
	mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产持有者手机号',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产发行者商户id',
	sp_type INT(1) NOT NULL DEFAULT 0 COMMENT '资产发行者，【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
	name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '数字资产名字',
	#assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产id',
	assets_type VARCHAR(64) NOT NULL DEFAULT '' COMMENT '数字资产类型。【film】电影票',
	balance INT NOT NULL DEFAULT 0 COMMENT '资产余额',
	price INT NOT NULL DEFAULT 0 COMMENT '资产价值',
	description TEXT COMMENT '资产说明',
	image_url VARCHAR(256) NOT NULL DEFAULT '' COMMENT '资产图标url',

	expire_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '过期时间',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	INDEX  idx_expire_time_mobile_assets_type_sp_id (expire_time, mobile, assets_type, sp_id),
	INDEX  idx_expire_time_mobile_sp_id (expire_time, mobile, sp_id),
	INDEX  idx_expire_time_sp_id_assets_type_mobile (expire_time, sp_id, assets_type, mobile)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_sp_balance";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_sp_balance (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '商户的id',
	assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产种类',
	balance INT NOT NULL DEFAULT 0 COMMENT '资产余额',
	description TEXT COMMENT '资产说明',

	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	INDEX idx_sp_id (sp_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_sp_receive";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_sp_balance (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
	mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '用户手机号',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产所属商户的id',
	assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产种类',
	balance INT NOT NULL DEFAULT 0 COMMENT '资产余额',

	expire_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '过期时间',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	UNIQUE INDEX  idx_expire_time_mobile_sp_id_assets_id (expire_time, mobile, sp_id, assets_id),
	INDEX idx_sp_id (sp_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_assets_trans";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_assets_trans (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
	payer_user_mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产付款方用户手机号',
	payer_sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产付款方商户id',
	payee_sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产收款方商户id',
	payee_user_mobile VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产收款方用户手机号',
	assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产种类',
	assets_description TEXT COMMENT '资产说明',
	count INT NOT NULL DEFAULT 0 COMMENT '商品的数量',
	total_price INT NOT NULL DEFAULT 0 COMMENT '总金额',
	fee INT NOT NULL DEFAULT 0 COMMENT '手续费',
	type INT(1) NOT NULL COMMENT '交易类型。【1】给用户发放资产【2】用户兑现资产【3】用户转让资产【4】用户充值稳定币,【5】商城交易',
	state INT(1) NOT NULL DEFAULT 1 COMMENT '交易结果：【0】交易失败，【1】交易成功',
	state_msg VARCHAR(512) NOT NULL DEFAULT '' COMMENT '交易状态的说明，如果交易失败则在此说明失败原因',
	extern_info VARCHAR(512) NOT NULL DEFAULT '' COMMENT '额外信息，用于存储外部商户对于该交易的描述',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	INDEX idx_payer_user_mobile (create_time, payer_user_mobile, type, state),
	INDEX idx_payer_sp_id (create_time, payer_sp_id, type, state),
	INDEX idx_payee_sp_id (create_time, payee_sp_id, type, state),
	INDEX idx_payee_user_mobile (create_time, payee_user_mobile, type, state)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_node_mall";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_node_mall (
	id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
	sp_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产发行者商户id',
	sp_type INT(1) NOT NULL DEFAULT 0 COMMENT '资产发行者，【0】商户，sp_id中是商户id，【1】用户，sp_id中是用户手机号',
	name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '数字资产名字',
	#assets_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '资产id',
	assets_type VARCHAR(64) NOT NULL DEFAULT '' COMMENT '数字资产类型。【film】电影票',
	balance INT NOT NULL DEFAULT 0 COMMENT '资产余额',
	price INT NOT NULL DEFAULT 0 COMMENT '资产价值',
	description TEXT COMMENT '资产说明',
	image_url VARCHAR(256) NOT NULL DEFAULT '' COMMENT '资产图标url',

	expire_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '过期时间',
	create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
	update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

	PRIMARY KEY (id),
	INDEX idx_expire_time_sp_id_sp_type (expire_time, sp_id, sp_type),
	INDEX idx_expire_time_name(expire_time, name)
) ENGINE=INNODB DEFAULT CHARSET=utf8;
";

echo "create t_operate_account";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "create table if not exists t_operate_account (
        id INT NOT NULL AUTO_INCREMENT COMMENT '自增id',
        mobile VARCHAR(32) NOT NULL DEFAULT '' COMMENT '账户手机号',
        password VARCHAR(64) NOT NULL DEFAULT '' COMMENT '账户密码',
        is_admin INT(1) NOT NULL DEFAULT 0 COMMENT '是否是管理员。【1】是，【0】不是',

        create_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '创建时间',
        update_time datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '修改时间',

        PRIMARY KEY (id),
        INDEX idx_mobile (mobile)
        ) ENGINE=INNODB DEFAULT CHARSET=utf8;
";
mysql -h$host -u$mysql_user -p$mysql_passwd $mysql_db -s -e "INSERT INTO t_operate_account (mobile, password, is_admin, create_time, update_time) value ('13666666666', '200820e3227815ed1756a6b531e7e0d2', 1, '2019-06-04 15:15:15', '2019-06-04 15:15:15');";


###################################


var logger = require('../common/log')("data_async");
var utils = require('../common/utils');

var arguments = process.argv;
// nextBlock == null means unspecified, so start from latest block processed record in db.
// if nextBlock is specified, start from it. if synced transaction already exist in db, ignore it.
var nextBlock = null;
if (arguments[2] !== undefined) {
    nextBlock = arguments[2];
}
var userAdress = null;

var mysql = require('../common/mysql');
var async = require('async');
var result = require('../common/result')();
var config = require('../config');
var ethereum = require('../common/ethereum');

var score_api_address = {
    REGISTER_SP                       : "0x2bc2ff58",   // authorizationStore
    TRANS_RELEASE_SCORE               : "0x59788697",   // mintPointsToStore
    TRANS_PRESENT_SCORE_BY_MOBILE     : "0x6552ae71",   // mintPointsToUsersByMobile
    TRANS_WITHDRAW_SCORE              : "0x242d823c",   // withDrawStoreToken

    REGISTER_USER                     : "0x84960166",   // authorizationUser
    TRANS_PAY_SCORE                   : "0x09a818b7",   // paymentPoints
    TRANS_TRANSFER_SCORE_BY_ADDRESS   : "0xd1d300f2",   // transferInUsers
    TRANS_TRANSFER_SCORE_BY_MOBILE    : "0x6757bdf5",   // transferInUsersByMobile
};

var free_score_api_address = {
    REGISTER_SP                       : "0xc7a7f22d",   // authorizationStore
    TRANS_RELEASE_SCORE               : "0xc0917cfe",   // mintPointsToStore
    TRANS_PRESENT_SCORE_BY_MOBILE     : "0x6552ae71",   // mintPointsToUsersByMobile
    REGISTER_SCORE_CONVERT            : "0xc6803534",   // AcceptStoreRequest

    REGISTER_USER                     : "0x84960166",   // authorizationUser
    TRANS_PAY_SCORE                   : "0x09a818b7",   // paymentPoints
    TRANS_TRANSFER_SCORE_BY_ADDRESS   : "0xd1d300f2",   // transferInUsers
    TRANS_TRANSFER_SCORE_BY_MOBILE    : "0x6757bdf5",   // transferInUsersByMobile
};

var trans_type = {
    USER_PAY:           1,
    USER_TRANSFER:      2,
    SP_PRESENT:         3,
    USER_CONVERT:       4,
    GRG_SCORE_RELEASE:  5,
};

function initStateDB(callback) {
    var sql_str = "update t_node_state set int_value = '?' where state_key = 'last_block'";
    var params = [username, mobile];
    mysql.query(sql_str, params, function (error, data) {
        if (error) {
            return callback(result.err_code.ERR_DB_ERROR);
        }

        if (!data instanceof Array) {
            console.log("read the data from mysql but data is not a array");
            return callback(result.err_code.ERR_UNKNOWN);
        }
        return callback(null, data[0] || null);
    });
}

function getAccountAddress(callback) {
    if (config.data_sync.wallet_address != null) {
        if (config.data_sync.user_address == "") {
            console.log("please specify the address of account for sync data at config.data_sync.user_address.");
            return callback(result.err_code.ERR_UNKNOWN);
        }
        else {
            console.log("read the address of account for sync data: " + config.data_sync.wallet_address);
            return callback(null, config.data_sync.wallet_address);
        }
    }
}

function getNextBLockIndex(callback) {
    if (nextBlock == null) {
        var sql = "select int_value from t_node_state where state_key = 'last_block'";
        mysql.query(sql, [], function (error, data) {
            if (error) {
                return callback(result.err_code.ERR_DB_ERROR);
            }

            if (!data instanceof Array) {
                console.log("read the data from mysql but data is not a array");
                return callback(result.err_code.ERR_UNKNOWN);
            }
            if (data[0].int_value == null) {
                return callback(result.err_code.ERR_UNKNOWN);
            }
            data[0].int_value += 1;
            console.log("read the start block:" + data[0].int_value);
            return callback(null, data[0].int_value);
        });
    }
    else {
        callback(null, nextBlock);
    }
}

function getBlockTransactionCount(blockIndex, callback) {
    ethereum.web3.eth.getBlockTransactionCount(blockIndex, function (error, data) {
        if (error) {
            console.log("read the block " + blockIndex + " error: " + error);
            return callback(result.err_code.ERR_ETHER_GET_FAILED);
        }
        if (data == null) {
            console.log("try read the block " + blockIndex + " but return null ");
            return callback(result.err_code.ERR_NO_MORE_NEW_BLOCK);
        }
        return callback(null, data);
    });
}

function endProcessBlock(blockIndex, callback) {
    var sql = "update t_node_state set int_value = ? where state_key = 'last_block'";
    mysql.query(sql, [blockIndex], function (error, data) {
        if (error) {
            return callback(result.err_code.ERR_DB_ERROR);
        }
        console.log("update the last block index:" + blockIndex);
        return callback(null, null);
    });
}

function processOneTrans(blockIndex, transIndex, callback) {
    var trans = null;
    async.waterfall([
        function (callback) {
            ethereum.web3.eth.getTransactionFromBlock(blockIndex, transIndex, function (error, data) {
                if (error) {
                    console.log("read the blockIndex " + blockIndex + " transIndex " + transIndex + " error: " + error);
                    return callback(result.err_code.ERR_ETHER_GET_FAILED);
                }
                return callback(null, data);
            });
        },
        function (data, callback) {
            trans = data;
            if (trans.to === config.geth.contract_address.score_user_contract.contract_address.toLowerCase()
                || trans.to === config.geth.contract_address.score_sp_contract.contract_address.toLowerCase()) {
                return resolveScoreTrans(trans, callback);
            }
            else if(trans.to === config.geth.contract_address.free_score_user_contract.contract_address.toLowerCase()
                || trans.to === config.geth.contract_address.free_score_sp_contract.contract_address.toLowerCase()) {
                return resolveFreeScoreTrans(trans, callback);
            }
            else {
                console.log("the trans: " +  trans.hash + " is not score transaction of score contract. pass it");
                return callback();
            }

        },
    ], function (error, result) {
        if (error) {
            return callback(error);
        }
        return callback(null, result);
    })
}

function resolveScoreTrans(trans, callback) {
    if (trans.input == undefined) {
        return callback(result.err_code.ERR_TRANS_INVALID);
    }

    var datetime = utils.getDatetime();
    var inputParams = trans.input;

    // drop the 0x
    inputParams = utils.delete0x(inputParams);

    // pop the function id
    var transCode = inputParams.substr(0, 8);
    inputParams = inputParams.substr(8);

    if (score_api_address.hasOwnProperty(transCode)) {
        console.log("the trans: " +  trans.hash + " is not score transaction. pass it");
        callback(null, null);
    }

    var transInfo = {};
    transInfo.transaction_id = trans.hash;
    transInfo.create_time = utils.getDatetime();
    transInfo.payer_user_mobile = '';
    transInfo.payer_sp_wallet_address = '';
    transInfo.payee_user_mobile = '';
    transInfo.payee_sp_wallet_address = '';
    transInfo.score = 0;
    transInfo.fee = 0;
    transInfo.type = '';
    transInfo.state = 0;
    transInfo.extern_info = '';
    transInfo.state_msg = '';

    async.waterfall([
        function (callback) {
            ethereum.web3.eth.getTransactionReceipt(trans.hash, function (error, data) {
                if (data.logs.length > 0) {
                    var err_code = utils.hexStr2Int(data.logs[0].data);
                    console.log("the transaction " + data.transactionHash + " is not success, error code is: " + err_code);
                    transInfo.state_msg = result.contract_err_code[err_code];
                    return callback(null, false);
                }
                else if (data.status == "0x0") {
                    console.log("the transaction " + data.transactionHash + " status is 0x0, skip it.");
                    return callback(null, false);
                }
                return callback(null, true);
            });
        },
        function (data, callback) {
            switch ("0x" + transCode) {
                case score_api_address.REGISTER_USER:
                    if (data == false) {
                        // skip the failed trans for user register
                        return callback(null, null);
                    }

                    var userInfo = {};
                    userInfo.wallet_address = '0x' + inputParams.substr(24, 40);
                    userInfo.username = utils.hexStr2Str(inputParams.substr(64, 64));
                    userInfo.mobile = utils.hexStr2Str('0x' + inputParams.substr(256, 64));
                    userInfo.create_time = datetime;
                    userInfo.update_time = datetime;
                    saveUserInfo(userInfo, callback);
                    break;
                case score_api_address.REGISTER_SP:
                    if (data == false) {
                        // skip the failed trans for user register
                        return callback(null, null);
                    }

                    var spInfo = {};
                    spInfo.wallet_address = getAddressFromInputParams(inputParams, 0);
                    spInfo.score_ratio = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 1));
                    spInfo.score_release = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 2));
                    spInfo.simple_name = utils.hexStr2Str(getBasicDataFromInputParams(inputParams, 3));
                    spInfo.score_name = utils.hexStr2Str(getBasicDataFromInputParams(inputParams, 4));
                    spInfo.score_expire = utils.hexStr2Int(getBasicDataFromInputParams(inputParams,5));
                    saveSpScoreInfo(spInfo, callback);
                    break;
                case score_api_address.TRANS_RELEASE_SCORE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = utils.getDatetime();
                    transInfo.payer_user_mobile = '';
                    transInfo.payer_sp_wallet_address = '';
                    transInfo.payee_user_mobile = '';
                    transInfo.payee_sp_wallet_address = getAddressFromInputParams(inputParams, 0);
                    transInfo.score = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 1));
                    transInfo.fee = 0;
                    transInfo.type = trans_type.GRG_SCORE_RELEASE;
                    transInfo.state = data? 1: 0;
                    transInfo.extern_info = getStringFromInputParams(inputParams, 2);
                    saveScoreTrans(transInfo, callback);
                    if (data == true) {
                        updateReleaseScoreRecored(transInfo.extern_info, 3, function (error, data) {});
                    }
                    break;
                case score_api_address.TRANS_WITHDRAW_SCORE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = utils.getDatetime();
                    transInfo.payer_user_mobile = '';
                    transInfo.payer_sp_wallet_address = '';
                    transInfo.payee_user_mobile = '';
                    transInfo.payee_sp_wallet_address = '0x' + inputParams.substr(24, 40);
                    transInfo.score = utils.hexStr2Int('0x' + inputParams.substr(64, 64));
                    transInfo.fee = 0;
                    transInfo.type = trans_type.GRG_SCORE_RELEASE;
                    transInfo.state = data? 1: 0;
                    transInfo.extern_info = getStringFromInputParams(inputParams, 128);
                    saveScoreTrans(transInfo, callback);
                    if (data == true) {
                        updateReleaseScoreRecored(transInfo.extern_info, 3, function (error, data) {});
                    }
                    else {
                        updateReleaseScoreRecored(transInfo.extern_info, 4, function (error, data) {});
                    }
                    break;
                case score_api_address.TRANS_PRESENT_SCORE_BY_MOBILE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);
                    transInfo.payer_user_mobile = '';
                    transInfo.payer_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.payee_user_mobile = getStringFromInputParams(inputParams, 2);
                    transInfo.payee_sp_wallet_address = '';
                    transInfo.score = getBasicDataFromInputParams(inputParams, 3);
                    transInfo.score = utils.hexStr2Int(transInfo.score);
                    transInfo.fee = 0;
                    transInfo.type = trans_type.SP_PRESENT;
                    transInfo.state = data? 1: 0;
                    transInfo.extern_info = getStringFromInputParams(inputParams, 6);
                    saveScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        updateSpUserScore(transInfo.payee_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                case score_api_address.TRANS_PAY_SCORE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);
                    transInfo.payer_sp_wallet_address = "";
                    transInfo.payee_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.score = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 2));
                    transInfo.payer_sp_wallet_address_list = getAddressArrayFromInputParams(inputParams, 3);
                    transInfo.payer_user_wallet_address = getAddressFromInputParams(inputParams, 4);
                    transInfo.score_list = getIntArrayFromInputParams(inputParams, 5);
                    transInfo.extern_info = getStringFromInputParams(inputParams, 8)
                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_PAY;
                    transInfo.state = data? 1: 0;

                    var payer_sp_wallet_address_list = [];
                    for (var index in transInfo.payer_sp_wallet_address_list) {
                        payer_sp_wallet_address_list.push(transInfo.payer_sp_wallet_address_list[index]);
                    }

                    transInfo.payer_sp_wallet_address_list = transInfo.payer_sp_wallet_address_list.join(",");
                    transInfo.score_list = transInfo.score_list.join(",");

                    saveScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        for(var index in payer_sp_wallet_address_list) {
                            updateSpUserScore(transInfo.payer_user_mobile, payer_sp_wallet_address_list[index], function (error, data) {});
                        }
                        updateSpUserScore(transInfo.payer_user_mobile, transInfo.payee_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                case score_api_address.TRANS_CONVERT_SCORE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = utils.hexStr2Int('0x' + inputParams.substr(0, 64));
                    transInfo.create_time = new Date(transInfo.create_time * 1000);

                    transInfo.payer_user_wallet_address = '0x' + inputParams.substr(88, 40);
                    transInfo.payer_sp_wallet_address = '0x' + inputParams.substr(152, 40);
                    transInfo.payee_sp_wallet_address = '0x' + inputParams.substr(216, 40);
                    transInfo.score = utils.hexStr2Int('0x' + inputParams.substr(256, 64));
                    transInfo.extern_info = getStringFromInputParams(inputParams, 448);

                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_CONVERT;
                    transInfo.state = data? 1: 0;

                    saveScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        updateSpUserScore(transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        updateSpUserScore(transInfo.payer_user_mobile, transInfo.payee_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                case score_api_address.TRANS_TRANSFER_SCORE_BY_MOBILE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);

                    transInfo.payer_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.payer_user_wallet_address = getAddressFromInputParams(inputParams, 2);
                    transInfo.payee_user_mobile = getStringFromInputParams(inputParams, 3);
                    transInfo.score = getBasicDataFromInputParams(inputParams, 4);
                    transInfo.score = utils.hexStr2Int(transInfo.score);
                    transInfo.extern_info = getStringFromInputParams(inputParams, 7);

                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_TRANSFER;
                    transInfo.state = data? 1: 0;

                    saveScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        transInfo = data;
                        updateSpUserScore(transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        updateSpUserScore(transInfo.payee_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                case score_api_address.TRANS_TRANSFER_SCORE_BY_ADDRESS:
                    console.log(trans);
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);

                    transInfo.payer_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.payer_user_wallet_address = getAddressFromInputParams(inputParams, 2);
                    transInfo.payee_user_wallet_address = getAddressFromInputParams(inputParams, 3);
                    transInfo.score = getBasicDataFromInputParams(inputParams, 4);
                    transInfo.score = utils.hexStr2Int(transInfo.score);
                    transInfo.extern_info = getStringFromInputParams(inputParams, 7);

                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_TRANSFER;
                    transInfo.state = data? 1: 0;

                    saveScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        transInfo = data;
                        updateSpUserScore(transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        updateSpUserScore(transInfo.payee_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                default:
                    console.log("the trans: " +  trans.hash + " is not score transaction. pass it");
                    callback(null, null);
                    break;
            }
        }
    ], function (error, data) {
        // if (error == result.err_code.ERR_ETHER_TRANS_FAILED) {
        //     return callback(null, null);
        // }
        if (error) {
            return callback(error);
        }
        return callback(null, data);
    });
}

function resolveFreeScoreTrans(trans, callback) {
    if (trans.input == undefined) {
        return callback(result.err_code.ERR_TRANS_INVALID);
    }

    var datetime = utils.getDatetime();
    var inputParams = trans.input;

    // drop the 0x
    inputParams = utils.delete0x(inputParams);

    // pop the function id
    var transCode = inputParams.substr(0, 8);
    inputParams = inputParams.substr(8);

    if (score_api_address.hasOwnProperty(transCode)) {
        console.log("the trans: " +  trans.hash + " is not score transaction. pass it");
        callback(null, null);
    }

    var transInfo = {};
    transInfo.transaction_id = trans.hash;
    transInfo.create_time = utils.getDatetime();
    transInfo.payer_user_mobile = '';
    transInfo.payer_sp_wallet_address = '';
    transInfo.payee_user_mobile = '';
    transInfo.payee_sp_wallet_address = '';
    transInfo.score = 0;
    transInfo.fee = 0;
    transInfo.type = '';
    transInfo.state = 0;
    transInfo.extern_info = '';
    transInfo.state_msg = '';

    async.waterfall([
        function (callback) {
            ethereum.web3.eth.getTransactionReceipt(trans.hash, function (error, data) {
                if (data.logs.length > 0) {
                    var err_code = utils.hexStr2Int(data.logs[0].data);
                    console.log("the transaction " + data.transactionHash + " is not success, error code is: " + err_code);
                    transInfo.state_msg = result.contract_err_code[err_code];
                    return callback(null, false);
                }
                else if (data.status == "0x0") {
                    console.log("the transaction " + data.transactionHash + " status is 0x0, skip it.");
                    return callback(null, false);
                }
                return callback(null, true);
            });
        },
        function (data, callback) {
            switch ("0x" + transCode) {
                case free_score_api_address.REGISTER_USER:
                    if (data == false) {
                        // skip the failed trans for user register
                        return callback(null, null);
                    }

                    var userInfo = {};
                    userInfo.wallet_address = getAddressFromInputParams(inputParams, 0);
                    userInfo.username = utils.hexStr2Str(getBasicDataFromInputParams(inputParams, 1));
                    userInfo.mobile = getStringFromInputParams(inputParams, 2);
                    userInfo.create_time = datetime;
                    userInfo.update_time = datetime;
                    saveUserInfo(userInfo, callback);
                    break;
                case free_score_api_address.REGISTER_SP:
                    if (data == false) {
                        // skip the failed trans for user register
                        return callback(null, null);
                    }

                    var spInfo = {};
                    spInfo.wallet_address = getAddressFromInputParams(inputParams, 0);
                    spInfo.simple_name = utils.hexStr2Str(getBasicDataFromInputParams(inputParams, 2));
                    spInfo.free_score_name = utils.hexStr2Str(getBasicDataFromInputParams(inputParams, 3));
                    spInfo.free_score_expire = utils.hexStr2Int(getBasicDataFromInputParams(inputParams,4));
                    saveSpFreeScoreInfo(spInfo, callback);
                    break;
                case free_score_api_address.TRANS_RELEASE_SCORE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = utils.getDatetime();
                    transInfo.payer_user_mobile = '';
                    transInfo.payer_sp_wallet_address = '';
                    transInfo.payee_user_mobile = '';
                    transInfo.payee_sp_wallet_address = '0x' + inputParams.substr(24, 40);
                    transInfo.score = utils.hexStr2Int('0x' + inputParams.substr(64, 64));
                    transInfo.fee = 0;
                    transInfo.type = trans_type.GRG_SCORE_RELEASE;
                    transInfo.state = data? 1: 0;
                    transInfo.extern_info = getStringFromInputParams(inputParams, 128);
                    saveScoreTrans(transInfo, callback);
                    if (data == true) {
                        updateReleaseScoreRecored(transInfo.extern_info, 3, function (error, data) {});
                    }
                    break;

                case free_score_api_address.TRANS_PRESENT_SCORE_BY_MOBILE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);
                    transInfo.payer_user_mobile = '';
                    transInfo.payer_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.payee_user_mobile = getStringFromInputParams(inputParams, 2);
                    transInfo.payee_sp_wallet_address = '';
                    transInfo.score = getBasicDataFromInputParams(inputParams, 3);
                    transInfo.score = utils.hexStr2Int(transInfo.score);
                    transInfo.fee = 0;
                    transInfo.type = trans_type.SP_PRESENT;
                    transInfo.state = data? 1: 0;
                    transInfo.extern_info = getStringFromInputParams(inputParams, 6);
                    saveFreeScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        updateSpUserFreeScore(transInfo.payee_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                case free_score_api_address.REGISTER_SCORE_CONVERT:
                    transInfo.proposer = getAddressFromInputParams(inputParams, 0);
                    transInfo.acceptor = getAddressFromInputParams(inputParams, 1);
                    transInfo.free_score_ratio_proposer = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 2));
                    transInfo.free_score_ratio_acceptor = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 3));
                    transInfo.state = 1;
                    transInfo.create_time = datetime;
                    transInfo.update_time = datetime;

                    saveFreeScoreConvertInfo(transInfo, callback);
                    break;
                case free_score_api_address.TRANS_PAY_SCORE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);
                    transInfo.payer_sp_wallet_address = "";
                    transInfo.payee_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.score = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 2));
                    transInfo.payer_sp_wallet_address_list = getAddressArrayFromInputParams(inputParams, 3);
                    transInfo.payer_user_wallet_address = getAddressFromInputParams(inputParams, 4);
                    transInfo.score_list = getIntArrayFromInputParams(inputParams, 5);
                    transInfo.extern_info = getStringFromInputParams(inputParams, 8)
                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_PAY;
                    transInfo.state = data? 1: 0;

                    var payer_sp_wallet_address_list = [];
                    for (var index in transInfo.payer_sp_wallet_address_list) {
                        payer_sp_wallet_address_list.push(transInfo.payer_sp_wallet_address_list[index]);
                    }

                    transInfo.payer_sp_wallet_address_list = transInfo.payer_sp_wallet_address_list.join(",");
                    transInfo.score_list = transInfo.score_list.join(",");

                    saveFreeScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        for(var index in payer_sp_wallet_address_list) {
                            updateSpUserFreeScore(transInfo.payer_user_mobile, payer_sp_wallet_address_list[index], function (error, data) {});
                        }
                        updateSpUserFreeScore(transInfo.payer_user_mobile, transInfo.payee_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });

                    break;
                case free_score_api_address.TRANS_TRANSFER_SCORE_BY_MOBILE:
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);

                    transInfo.payer_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.payer_user_wallet_address = getAddressFromInputParams(inputParams, 2);
                    transInfo.payee_user_mobile = getStringFromInputParams(inputParams, 3);
                    transInfo.score = getBasicDataFromInputParams(inputParams, 4);
                    transInfo.score = utils.hexStr2Int(transInfo.score);
                    transInfo.extern_info = getStringFromInputParams(inputParams, 7);

                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_TRANSFER;
                    transInfo.state = data? 1: 0;

                    saveFreeScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        transInfo = data;
                        updateSpUserFreeScore(transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        updateSpUserFreeScore(transInfo.payee_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                case free_score_api_address.TRANS_TRANSFER_SCORE_BY_ADDRESS:
                    console.log(trans);
                    transInfo.transaction_id = trans.hash;
                    transInfo.create_time = getTimestampFromInputParams(inputParams, 0);
                    transInfo.create_time = new Date(transInfo.create_time * 1000);

                    transInfo.payer_sp_wallet_address = getAddressFromInputParams(inputParams, 1);
                    transInfo.payer_user_wallet_address = getAddressFromInputParams(inputParams, 2);
                    transInfo.payee_user_wallet_address = getAddressFromInputParams(inputParams, 3);
                    transInfo.score = utils.hexStr2Int(getBasicDataFromInputParams(inputParams, 4));
                    transInfo.extern_info = getStringFromInputParams(inputParams, 7);

                    transInfo.fee = 0;
                    transInfo.type = trans_type.USER_TRANSFER;
                    transInfo.state = data? 1: 0;

                    saveFreeScoreTrans(transInfo, function (error, data) {
                        if (error) {
                            return callback(error);
                        }
                        transInfo = data;
                        updateSpUserFreeScore(transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        updateSpUserFreeScore(transInfo.payee_user_mobile, transInfo.payer_sp_wallet_address, function (error, data) {});
                        return callback(null, null);
                    });
                    break;
                default:
                    console.log("the trans: " +  trans.hash + " is not score transaction. pass it");
                    callback(null, null);
                    break;
            }
        }
    ], function (error, data) {
        // if (error == result.err_code.ERR_ETHER_TRANS_FAILED) {
        //     return callback(null, null);
        // }
        if (error) {
            return callback(error);
        }
        return callback(null, data);
    });
}

function getTotalScoreByDiffSpScore(spWalletAddressArray, spScoreArray, targetSpAddress, callback) {
    var spWalletAddressArrayTmp = [];
    for(var index in spWalletAddressArray) {
        spWalletAddressArrayTmp.push(spWalletAddressArray[index]);
    }
    spWalletAddressArrayTmp.push(targetSpAddress);

    var ratioArray = [];
    var index = 0;
    async.whilst(
        function () {
            return index < spWalletAddressArrayTmp.length;
        },
        function (callback) {
            ethereum.scoreSpContractInstance.GetStoreInfo(spWalletAddressArrayTmp[index], function (error, data) {
                if (error) {
                    return callback("there is no sp in the geth:" + spWalletAddressArrayTmp[index]);
                }

                ratioArray.push(parseInt(data[0]));
                index += 1;
                return callback(null, null);
            });
        },
        function (error, result) {
            if (error) {
                return callback(error);
            }
            // to yuntonglishi
            var yuntonglishi = 0;
            for(var index in spScoreArray) {
                yuntonglishi += spScoreArray[index] / ratioArray[index];
            }
            var result = yuntonglishi * ratioArray[ratioArray.length - 1];
            return callback(null, result);
        }
    );
}

function getTotalFreeScoreByDiffSpScore(spWalletAddressArray, spScoreArray, targetSpAddress, callback) {
    var total = 0;
    var spWalletAddressArrayTmp = [];
    for(var index in spWalletAddressArray) {
        spWalletAddressArrayTmp.push(spWalletAddressArray[index]);
    }
    // spWalletAddressArrayTmp.push(targetSpAddress);

    var index = 0;
    async.whilst(
        function () {
            return index < spWalletAddressArrayTmp.length;
        },
        function (callback) {
            ethereum.freeScoreSpContractInstance.GetStoreAccessInfo(spWalletAddressArrayTmp[index], targetSpAddress, function (error, data) {
                if (error) {
                    logger.error(error);
                    return callback("there is no sp in the geth:" + spWalletAddressArrayTmp[index]);
                }
                total += data[1] * spScoreArray[index] / data[0];
                index += 1;
                return callback(null, null);
            });
        },
        function (error, result) {
            if (error) {
                return callback(error);
            }
            return callback(null, total);
        }
    );
}

function updateReleaseScoreRecored(applyId, state, callback) {
    if (applyId == undefined || applyId == "" ) {
        return callback(null, null);
    }
    var sqlStr = "update t_sp_release_score_apply_record set state = ? where id = ?";
    var sqlParams = [state, parseInt(applyId)];
    mysql.query(sqlStr, sqlParams, function (error, data) {
        if (error && error.code === "ER_NO_SUCH_TABLE") {
            logger.info("the table t_sp_release_score_apply_record is not exists, maybe you are not the central node.");
        }
        else if (error) {
            logger.error(error);
        }
        return callback(null, data);
    });
}

function getStringFromInputParams(inputParams, offsetAddress) {
    var offset = utils.hexStr2Int('0x' + inputParams.substr(offsetAddress, 64)) * 2;
    var length = utils.hexStr2Int('0x' + inputParams.substr(offset, 64)) * 2;
    var str = utils.hexStr2Str('0x' + inputParams.substr(offset + 64, length));
    return str;
}
function getBasicDataFromInputParams(inputParams, n) {
    return inputParams.substr(n * 64, 64);
}
function getBasicDataArrayFromInputParams(inputParams, n) {
    var data = getBasicDataFromInputParams(inputParams, n);
    var offsetline = utils.hexStr2Int(data) * 2 / 64;
    var length = getBasicDataFromInputParams(inputParams, offsetline);
    length = utils.hexStr2Int(length);
    var result = [];
    for(var index = 0; index < length; index ++) {
        var arrayData = getBasicDataFromInputParams(inputParams, offsetline + index + 1);
        result.push(arrayData);
    }
    return result;
}


function getTimestampFromInputParams(inputParams, n) {
    var address = getBasicDataFromInputParams(inputParams, n);
    return '0x' + address.substr(56);
}
function getAddressFromInputParams(inputParams, n) {
    var timestamp = getBasicDataFromInputParams(inputParams, n);
    return '0x' + timestamp.substr(24);
}
function getAddressArrayFromInputParams(inputParams, n) {
    var basicDataArray = getBasicDataArrayFromInputParams(inputParams, n);
    for(var index in basicDataArray) {
        basicDataArray[index] = '0x' + basicDataArray[index].substr(24);
    }
    return basicDataArray;
}
function getIntArrayFromInputParams(inputParams, n) {
    var basicDataArray = getBasicDataArrayFromInputParams(inputParams, n);
    for(var index in basicDataArray) {
        basicDataArray[index] = utils.hexStr2Int(basicDataArray[index]);
    }
    return basicDataArray;
}
function getStringFromInputParams(inputParams, n) {
    var data = getBasicDataFromInputParams(inputParams, n);
    var offsetline = utils.hexStr2Int(data) * 2 / 64;
    var length = getBasicDataFromInputParams(inputParams, offsetline);
    length = utils.hexStr2Int(length);


    var result = '0x' + inputParams.substr((offsetline + 1) * 64, length * 2);
    return utils.hexStr2Str(result);
}


function processAllTransOfBlock (blockIndex, transCount, callback) {
    var transIndex = 0;

    async.doWhilst(
        function (next) {
            processOneTrans(blockIndex, transIndex, function (error, data) {
                if (error) {
                    return next(error);
                }
                return next(null, null);
            });
        },
        function () {
            transIndex += 1;
            return transIndex <= transCount - 1;
        },
        function (error, result) {
            if (error) {
                return callback(error);
            }
            return callback(null, result);
        }
    );
}

function processOneBlock(callback) {
    var nextBlock = 0;
    var transCount = 0;
    async.waterfall([
        function (next) {
            // read the next block index from t_node_state
            getNextBLockIndex(next);
        },
        function (data, next) {
            // check if the block exist
            nextBlock = data;
            console.log("start process block: " + nextBlock);
            getBlockTransactionCount(nextBlock, next);
            // ERR_NO_MORE_NEW_BLOCK will sent to error handler
        },
        function (data, next) {
            transCount = data;
            console.log("the trans count of block: " + nextBlock + " is: " + transCount);
            if (transCount == 0) {
                return next(null, null);
            }else {
                return processAllTransOfBlock(nextBlock, transCount, next);
            }
        },
        function (data, next) {
            return endProcessBlock(nextBlock, next);
        }
    ], function (error, data) {
            if (error) {
                return callback(error);
            }
            return callback(null, null);
        })
}

function startProcess(callback) {
    var isContinue = true;
    async.doWhilst(
        function (callback) {
            processOneBlock(callback);
        },
        function () {
            return isContinue;
        },
        function (error, result) {
            if (error) {
                return callback(error);
            }
            return callback(null, result);
        }
    )
}

function saveSpScoreInfo(spInfo, callback) {
    var datetime = utils.getDatetime();
    var sqlStr = "insert into t_node_sp_score_info (simple_name, score_name, wallet_address, score_ratio, score_expire, create_time, update_time) " +
        "values (?, ?, ?, ?, ?, ?, ?) on duplicate key update score_name = ?, score_ratio = ?, score_expire = ?, update_time = ?; ";
    var sqlParams = [spInfo.simple_name, spInfo.score_name, spInfo.wallet_address, spInfo.score_ratio, spInfo.score_expire,
        datetime, datetime, spInfo.score_name, spInfo.score_ratio, spInfo.score_expire, datetime];
    mysql.query(sqlStr, sqlParams, function (error, data) {
        if (error && error.code == 'ER_DUP_ENTRY') {
            return callback(null, null);
        }
        if (error) {
            logger.error(error);
            return callback(result.err_code.ERR_DB_ERROR);
        }
        return callback(null, data);
    });
}

function saveSpFreeScoreInfo(spInfo, callback) {
    var datetime = utils.getDatetime();
    var sqlStr = "insert into t_node_sp_score_info (simple_name, wallet_address, free_score_name, free_score_expire, create_time, update_time) " +
        "values (?, ?, ?, ?, ?, ?) on duplicate key update free_score_name = ?, free_score_expire = ?, update_time = ?";
    var sqlParams = [spInfo.simple_name, spInfo.wallet_address, spInfo.free_score_name, spInfo.free_score_expire, datetime, datetime,
        spInfo.free_score_name, spInfo.free_score_expire, datetime];
    mysql.query(sqlStr, sqlParams, function (error, data) {
        if (error && error.code == 'ER_DUP_ENTRY') {
            return callback(null, null);
        }
        if (error) {
            logger.error(error);
            return callback(result.err_code.ERR_DB_ERROR);
        }
        return callback(null, data);
    });
}

function saveScoreTrans(transInfo, callback) {
    async.waterfall([
        function (callback) {
            if((transInfo.payer_user_mobile == undefined || transInfo.payer_user_mobile == "")
                && transInfo.payer_user_wallet_address != undefined && transInfo.payer_user_wallet_address != "") {

                // transfer the payer user wallet address to his mobile;
                ethereum.scoreUserContractInstance.GetUserInfoByUserAddress(transInfo.payer_user_wallet_address, function (error, data) {
                    if (error) {
                        console.log("read the user info (" + transInfo.payer_user_wallet_address + ") error: " + error);
                        return callback(result.err_code.ERR_ETHER_GET_FAILED);
                    }
                    // the mobile is empty ?
                    if (data[0] == "") {
                        console.log("try read the user info (" + transInfo.payer_user_wallet_address + ") but return null ");
                        return callback(result.err_code.ERR_USER_NOT_EXIST);
                    }
                    transInfo.payer_user_mobile = data[0];
                    return callback(null, data);
                });
            }
            else {
                return callback(null, null);
            }
        },
        function (data, callback) {
            if((transInfo.payee_user_mobile == undefined || transInfo.payee_user_mobile == "")
                && transInfo.payee_user_wallet_address != undefined && transInfo.payee_user_wallet_address != "") {

                // transfer the payee user wallet address to his mobile;
                ethereum.scoreUserContractInstance.GetUserInfoByUserAddress(transInfo.payee_user_wallet_address, function (error, data) {
                    if (error) {
                        console.log("read the user info (" + transInfo.payee_user_wallet_address + ") error: " + error);
                        return callback(result.err_code.ERR_ETHER_GET_FAILED);
                    }
                    if (data[0] == "") {
                        console.log("try read the user info (" + transInfo.payee_user_wallet_address + ") but return null ");
                        return callback(result.err_code.ERR_USER_NOT_EXIST);
                    }
                    transInfo.payee_user_mobile = data[0];
                    return callback(null, data);
                });
            }
            else {
                return callback(null, null);
            }
        },
        function (data, callback) {
            var sqlStr = "insert into t_node_score_trans (transaction_id, payer_user_mobile, payer_sp_wallet_address, payer_sp_wallet_address_list, " +
                "payee_user_mobile, " +
                "payee_sp_wallet_address, score_list, score, fee, type, state, extern_info, create_time, update_time, state_msg) values " +
                "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            var sqlParams = [transInfo.transaction_id, transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, transInfo.payer_sp_wallet_address_list,
                transInfo.payee_user_mobile, transInfo.payee_sp_wallet_address,
                transInfo.score_list, transInfo.score, transInfo.fee, transInfo.type,
                transInfo.state, transInfo.extern_info, transInfo.create_time, transInfo.create_time, transInfo.state_msg];
            mysql.query(sqlStr, sqlParams, function (error, data) {
                if (error && error.code == 'ER_DUP_ENTRY') {
                    return callback(null, null);
                }
                if (error) {
                    logger.error(error);
                    return callback(null, null);
                }
                return callback(null, data);
            });
        },
    ], function (error, data) {
        if(error) {
            logger.error(error);
            return callback(error);
        }
        return callback(null, transInfo);
    });
}

function saveFreeScoreTrans(transInfo, callback) {
    async.waterfall([
        function (callback) {
            if((transInfo.payer_user_mobile == undefined || transInfo.payer_user_mobile == "")
                && transInfo.payer_user_wallet_address != undefined && transInfo.payer_user_wallet_address != "") {

                // transfer the payer user wallet address to his mobile;
                ethereum.freeScoreUserContractInstance.GetUserInfoByUserAddress(transInfo.payer_user_wallet_address, function (error, data) {
                    if (error) {
                        console.log("read the user info (" + transInfo.payer_user_wallet_address + ") error: " + error);
                        return callback(result.err_code.ERR_ETHER_GET_FAILED);
                    }
                    // the mobile is empty ?
                    if (data[0] == "") {
                        console.log("try read the user info (" + transInfo.payer_user_wallet_address + ") but return null ");
                        return callback(result.err_code.ERR_USER_NOT_EXIST);
                    }
                    transInfo.payer_user_mobile = data[0];
                    return callback(null, data);
                });
            }
            else {
                return callback(null, null);
            }
        },
        function (data, callback) {
            if((transInfo.payee_user_mobile == undefined || transInfo.payee_user_mobile == "")
                && transInfo.payee_user_wallet_address != undefined && transInfo.payee_user_wallet_address != "") {

                // transfer the payee user wallet address to his mobile;
                ethereum.freeScoreUserContractInstance.GetUserInfoByUserAddress(transInfo.payee_user_wallet_address, function (error, data) {
                    if (error) {
                        console.log("read the user info (" + transInfo.payee_user_wallet_address + ") error: " + error);
                        return callback(result.err_code.ERR_ETHER_GET_FAILED);
                    }
                    if (data[0] == "") {
                        console.log("try read the user info (" + transInfo.payee_user_wallet_address + ") but return null ");
                        return callback(result.err_code.ERR_USER_NOT_EXIST);
                    }
                    transInfo.payee_user_mobile = data[0];
                    return callback(null, data);
                });
            }
            else {
                return callback(null, null);
            }
        },
        function (data, callback) {
            var sqlStr = "insert into t_node_free_score_trans (transaction_id, payer_user_mobile, payer_sp_wallet_address, payer_sp_wallet_address_list, " +
                "payee_user_mobile, " +
                "payee_sp_wallet_address, score_list, score, fee, type, state, extern_info, create_time, update_time, state_msg) values " +
                "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            var sqlParams = [transInfo.transaction_id, transInfo.payer_user_mobile, transInfo.payer_sp_wallet_address, transInfo.payer_sp_wallet_address_list,
                transInfo.payee_user_mobile, transInfo.payee_sp_wallet_address,
                transInfo.score_list, transInfo.score, transInfo.fee, transInfo.type,
                transInfo.state, transInfo.extern_info, transInfo.create_time, transInfo.create_time, transInfo.state_msg];
            mysql.query(sqlStr, sqlParams, function (error, data) {
                if (error && error.code == 'ER_DUP_ENTRY') {
                    return callback(null, null);
                }
                if (error) {
                    logger.error(error);
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, data);
            });
        },
    ], function (error, data) {
        if(error) {
            logger.error(error);
            return callback(error);
        }
        return callback(null, transInfo);
    });
}

function updateSpUserScore(userMobile, spWalletAddress, callback) {
    var score = 0;
    var scoreLastExpire = 0;
    var scoreLastExpireMonth = 0;
    async.waterfall([
        function (callback) {
            ethereum.scoreUserContractInstance.BalanceofStorePointByMobile(spWalletAddress, userMobile, function (error, data) {
                if (error) {
                    console.log("read the user score of sp (" + userMobile + ", " + spWalletAddress + ") error: " + error);
                    return callback(result.err_code.ERR_ETHER_GET_FAILED);
                }
                if (data == null) {
                    console.log("try user score of sp (" + userMobile + ", " + spWalletAddress + ") but return null ");
                    return callback(result.err_code.ERR_USER_NOT_EXIST);
                }
                score = data[0].toString();
                scoreLastExpire = data[1].toString();
                scoreLastExpireMonth = utils.getMonthDateTime(new Date());

                return callback(null, data);
            });
        },
        function (data, callback) {
            var nowTime = utils.getDatetime();
            var sqlStr = "insert into t_node_sp_user_score_state (user_mobile, sp_wallet_address  , score, score_last_expire, score_last_expire_month, create_time, update_time) values (?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE key UPDATE score = ?, score_last_expire = ?, score_last_expire_month = ?, update_time = ?;";
            var sqlParams = [userMobile, spWalletAddress, score, scoreLastExpire, scoreLastExpireMonth, nowTime, nowTime, score, scoreLastExpire, scoreLastExpireMonth, nowTime];
            mysql.query(sqlStr, sqlParams, function (error, data) {
                if (error && error.code == 'ER_DUP_ENTRY') {
                    return callback(null, null);
                }
                if (error) {
                    logger.error(error);
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, data);
            });
        }
    ], function (error, data) {
        if (error) {
            return callback(error);
        }
        return callback(null, data);
    })
}

function updateSpUserFreeScore(userMobile, spWalletAddress, callback) {
    var score = 0;
    var scoreLastExpire = 0;
    var scoreLastExpireMonth = 0;
    async.waterfall([
        function (callback) {
            ethereum.freeScoreUserContractInstance.BalanceofStorePointByMobile(spWalletAddress, userMobile, function (error, data) {
                if (error) {
                    console.log("read the user score of sp (" + userMobile + ", " + spWalletAddress + ") error: " + error);
                    return callback(result.err_code.ERR_ETHER_GET_FAILED);
                }
                if (data == null) {
                    console.log("try user score of sp (" + userMobile + ", " + spWalletAddress + ") but return null ");
                    return callback(result.err_code.ERR_USER_NOT_EXIST);
                }
                score = data[0].toString();
                scoreLastExpire = data[1].toString();
                scoreLastExpireMonth = utils.getMonthDateTime(new Date());

                return callback(null, data);
            });
        },
        function (data, callback) {
            var nowTime = utils.getDatetime();
            var sqlStr = "insert into t_node_sp_user_free_score_state (user_mobile, sp_wallet_address  , score, score_last_expire, score_last_expire_month, create_time, update_time) values (?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE key UPDATE score = ?, score_last_expire = ?, score_last_expire_month = ?, update_time = ?;";
            var sqlParams = [userMobile, spWalletAddress, score, scoreLastExpire, scoreLastExpireMonth, nowTime, nowTime, score, scoreLastExpire, scoreLastExpireMonth, nowTime];
            mysql.query(sqlStr, sqlParams, function (error, data) {
                if (error && error.code == 'ER_DUP_ENTRY') {
                    return callback(null, null);
                }
                if (error) {
                    logger.error(error);
                    return callback(result.err_code.ERR_DB_ERROR);
                }
                return callback(null, data);
            });
        }
    ], function (error, data) {
        if (error) {
            return callback(error);
        }
        return callback(null, data);
    })
}


function saveUserInfo(userInfo, callback) {
    var sqlStr = "insert into t_node_user_score_info (mobile, wallet_address, create_time,  update_time) values (?, ?, ?, ?)";
    var sqlParams = [userInfo.mobile, userInfo.wallet_address, userInfo.create_time, userInfo.update_time];
    mysql.query(sqlStr, sqlParams, function (error, data) {
        if (error && error.code == 'ER_DUP_ENTRY') {
            return callback(null, null);
        }
        if (error) {
            logger.error(error);
            return callback(result.err_code.ERR_DB_ERROR);
        }
        return callback(null, data);
    });
}

function saveFreeScoreConvertInfo(convertInfo, callback) {
    var spAddressPair = utils.getDataPair(convertInfo.proposer, convertInfo.acceptor);
    var sqlStr = "insert into t_node_free_score_convert_info (unique_sp_address_pair, proposer, acceptor, " +
        "free_score_ratio_proposer, free_score_ratio_acceptor, state, create_time, update_time) " +
        "values (?, ?, ?, ?, ?, ?, ?, ?) " +
        "on duplicate key update proposer = ?, acceptor = ?, free_score_ratio_proposer = ?, free_score_ratio_acceptor = ?, " +
        "state = ?, update_time = ?;"
    var sqlParams = [spAddressPair, convertInfo.proposer, convertInfo.acceptor, convertInfo.free_score_ratio_proposer,
    convertInfo.free_score_ratio_acceptor, convertInfo.state, convertInfo.create_time, convertInfo.update_time,
    convertInfo.proposer, convertInfo.acceptor, convertInfo.free_score_ratio_proposer, convertInfo.free_score_ratio_acceptor,
    convertInfo.state, convertInfo.update_time];
    mysql.query(sqlStr, sqlParams, function (error, data) {
        if (error && error.code == 'ER_DUP_ENTRY') {
            return callback(null, null);
        }
        if (error) {
            logger.error(error);
            return callback(result.err_code.ERR_DB_ERROR);
        }
        return callback(null, data);
    });
}

/////main/////

async.doWhilst(function (callback) {
    getAccountAddress(function () {

    })
})
async.waterfall([
    function (callback) {
        getAccountAddress(callback);
    },
    function (data, callback) {
        async.doWhilst(function (next) {
            startProcess(function (error, data) {
                if (error == result.err_code.ERR_NO_MORE_NEW_BLOCK) {
                    setTimeout(function () {
                        return next(null, null);
                    }, 1000);
                }
            });
        },
        function () {
            return true;
        },
        function (error, result) {
            return callback(error, result);
        });
    }
], function (error, result) {
    if(error) {
        console.log(error);
        return;
    }
    console.log(result);
});






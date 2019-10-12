const secp256k1 = require("secp256k1/elliptic");
const createKeccakHash =  require("keccak");
const crypto = require('crypto');
let moment = require('moment');
let string_random = require('string-random');
let logger = require('../common/log')("utils");

module.exports = {
    checkEmpty: function (param) {
        return param === undefined || param === null || param == "";
    },
    randomString: function (len) {
        return string_random(len);
    },
    checkSignature: function(data, key_base64_encode, iv_base64_encode, signature) {
        // console.log("original:" + data + " key:" + key_base64_encode + " iv:" + iv_base64_encode);
        let encrypted = this.encryption(data, key_base64_encode, iv_base64_encode);
        // console.log("encrypted:" + encrypted);
        let signed = this.sign(encrypted);
        // console.log("sigend:" + signed);

        return signature == signed;
    },
    genSignature: function (data, key, iv) {
        try {
            // console.log("original:" + data + " key:" + key + " iv:" + iv);
            let encrypted = this.encryption(data, key, iv);
            if (!encrypted) {
                return false;
            }
            // console.log("encrypted:" + encrypted);
            let signed = this.sign(encrypted);
            // console.log("sigend:" + signed);
            return signed;
        }
        catch (e) {
            logger.error(e);
            return null;
        }

    },
    sign: function (data) {
        return crypto.createHash('sha1').update(data).digest('hex').toUpperCase();
    },
    base64_encode: function (data) {
        let encoded = Buffer.from(data).toString("base64");
        return encoded;
    },
    base64_decode: function (data_base64_encode) {
        return Buffer.from(data_base64_encode, "base64").toString();
    },
    encryption: function (data, key_base64_encode, iv_base64_encode) {
        try {
            // key = new Buffer(key, "base64").toString();
            // iv = new Buffer(iv, "base64").toString();

            let key_str = Buffer.from(key_base64_encode, "base64").toString();
            let iv_str = Buffer.from(iv_base64_encode, "base64").toString();

            // console.log("key:" + key_str);
            // console.log("iv:" + iv_str);
            // key = Buffer.from(key, 'utf8');
            // iv = Buffer.from(iv, 'utf8');

            const cipher = crypto.createCipheriv("aes-128-cbc", key_str, iv_str);
            cipher.setAutoPadding(true);

            let encrypted = cipher.update(data, "utf8", "hex");
            encrypted += cipher.final("hex");
            return encrypted.toUpperCase();
        }catch (e) {
            console.log(e);
            return false;
        }
    },
    /**
     * success return string, failed return null
     * @param encrypted
     * @param key
     * @returns {*}
     */
    decryption: function (encrypted, key, iv) {
        try {
            // key = new Buffer(key, "base64").toString();
            // iv = new Buffer(iv, "base64").toString();

            key = Buffer.from(key, "base64").toString();
            iv = Buffer.from(iv, "base64").toString();
            // key = Buffer.from(key, "base64");
            // iv = Buffer.from(iv, "base64");

            const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
            decipher.setAutoPadding(true);

            let decrypted = decipher.update(encrypted, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        }catch (e) {
            console.log(e);
            return null;
        }

    },
    getUnixTimeSecond: function () {
        return parseInt((new Date().getTime()) / 1000);
    },
    getDatetime: function() {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    },
    getTimeByDays: function(days) {
        return moment().add(days, 'days').format('YYYY-MM-DD HH:mm:ss');
    },
    getFloorUpMonthDatetimeAfter: function (month) {
        return moment().add(month, "month").endOf("month").format('YYYY-MM-DD 23:59:59');
    },
    getDateTimeByInputTime: function(datetime) {
        var year = datetime.getFullYear();
        var month = (datetime.getMonth()+1 < 10 ? '0'+(datetime.getMonth()+1) : datetime.getMonth()+1);
        var date = datetime.getDate();
        var hour = datetime.getHours();
        var minute = datetime.getMinutes();
        var second = datetime.getSeconds();

        return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
    },
    /**
     * 用2019-06-01 00:00:00来代表2019年6月
     * @param datetime
     * @returns {string}
     */
    getMonthDateTime: function(datetime) {
        var year = datetime.getFullYear();
        var month = (datetime.getMonth()+1 < 10 ? '0'+(datetime.getMonth()+1) : datetime.getMonth()+1);
        var date = "01";
        return year + "-" + month + "-" + date + " 00:00:00";
    },
    getMonthFlooredUpByTimestamp: function(timestamp) {
        return moment.unix(timestamp).endOf('month').format('YYYY-MM-DD 23:59:59');

    },
    SignHashHex: function (originalStr, privateKey) {
        privateKey = this.delete0x(privateKey);
        var privateKeyBuf = Buffer.from(privateKey, 'hex');
        var signObj = secp256k1.sign(originalStr, privateKeyBuf);

        var sign_str = '';
        if (signObj.recovery == 1) {
            sign_str = "0x"+secp256k1.sign(originalStr, privateKeyBuf).signature.toString('hex')+"00";
        }
        else {
            sign_str = "0x"+secp256k1.sign(originalStr, privateKeyBuf).signature.toString('hex')+"01";
        }
        return sign_str;
    },

    delete0x: function (str) {
        str = str.toString();
        if (str.length < 2) {
            return str;
        }
        if (str.substr(0, 2) == '0x') {
            return str.substr(2);
        }
        return str;
    },
    delete0xAndJoin: function (list) {
        var result = [];
        for(var index in list) {
            result.push(this.delete0x(list[index]));
        }
        return result.join("");
    },
    num2Buffer: function (num) {
        var hexStr = num.toString(16);
        if (hexStr.length % 2 == 1) {
            hexStr = '0' + hexStr;
        }
        var hexBuffer = Buffer.from(hexStr, 'hex');
        return hexBuffer;
    },
    hexStr2Buffer: function (hexStr) {
        hexStr = this.delete0x(hexStr);
        var buffer = Buffer.from(hexStr, 'hex');
        return buffer;
    },
    hexStr2Str: function (hexStr) {
        var buffer = this.hexStr2Buffer(hexStr);
        var index = buffer.length - 1;
        while (index >= 0 && buffer[index] == 0) {
            index --;
        }
        var buffer = buffer.subarray(0,  index + 1);
        var str = buffer.toString('utf8');
        return str;
    },
    str2Buffer: function (str) {
        var hexBuffer = Buffer.from(str);
        return hexBuffer;
    },

    buffer2HexStr: function (buff) {
        var hexStr = buff.toString('hex');
        if (hexStr.length % 2 == 1) {
            hexStr = '0' + hexStr;
        }
        // hexStr += "0x";
        return hexStr;
    },

    num2HexStr: function (num) {
        var hexStr = num.toString(16);
        if (hexStr.length % 2 == 1) {
            hexStr = '0' + hexStr;
        }
        // hexStr += "0x";
        return hexStr;
    },

    numArray2HexStr: function (numArray) {
        var result = [];
        for(var index in numArray) {
            result.push(this.num2HexStr(numArray[index]));
        }

        return result.join("");
    },

    str2HexStr: function (str) {
        var buff = this.str2Buffer(str);
        var hexStr = this.buffer2HexStr(buff);
        return hexStr;
    },
    hash: function (str) {
        return createKeccakHash("keccak256").update(str).digest();
    },
    hashAllParams: function (arr) {
        var originalStr = '';
        for (var index in arr) {
            if (typeof(arr[index]) == "string") {
                originalStr += this.str2HexStr(arr[index]);
            }
            else if (typeof(arr[index]) == "number") {
                originalStr += this.num2HexStr(arr[index]);
            }
            else {
                console.log("params is invalid.");
            }
        }
        console.log("original str: " + originalStr);
        var hashBuff = createKeccakHash("keccak256").update(originalStr).digest();
        return hashBuff;
    },
    hexStr2Int: function (hexStr) {
        return parseInt(hexStr, 16);
    },

    getDataPair: function(a, b) {
        if (a > b) {
            return b + "_" + a;
        }
        else if (a < b) {
            return a + "_" + b;
        }
        else {
            return a + "_" + b;
        }
    },
};

let utils = require('../common/utils');
const crypto = require('crypto');
// let str = crypto.createHash('sha1').update("zhangke").digest('hex').toUpperCase();

let key = "xqcV166Ymj3FMKDT";
let iv = "ysdsMFU7Hb3SgzG2";

key = Buffer.from(key, "utf8").toString("base64");
iv = Buffer.from(iv, "utf8").toString("base64");


// key = new Buffer(key).toString("base64");
// iv = new Buffer(iv).toString("base64");

console.log(key);
console.log(iv);
//
// key = new Buffer(key, "base64").toString();
// iv = new Buffer(iv, "base64").toString();
//
// console.log(key);
// console.log(iv);
//
// return;

let data = "0000000000000101300ZGEzOWEzZWU1ZTZiNGIwZDMyNTViZmVmOTU2MDE4OTBhZmQ4MDcwOQ==2019-06-18 16:39:45";
let encrypted_data = "";

encrypted_data = utils.encryption(data, key, iv);
console.log(encrypted_data);

data = crypto.createHash('sha1').update(encrypted_data).digest('hex').toUpperCase();
console.log(data)

data = utils.decryption(encrypted_data, key, iv);
console.log(data);
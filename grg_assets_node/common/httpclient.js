var http = require('http') ;
var https = require('https');
var querystring = require('querystring');
var logger = require('../common/log')("httpclient");


//////////////////////////////http request /////////////////////////
function doPost(options,data,callback){
    var body = "";
    var postData = querystring.stringify(data);
    logger.info("发送体:",postData);

    const req = http.request(options, (res) => {
        logger.info("状态码:",res.statusCode);
        logger.info("响应头:",JSON.stringify(res.headers));

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end',() => {
            try{
                logger.info("原始响应体:",body);
                let data = JSON.parse(body);   //string -> json
                logger.info("响应体:",data);
                callback(null,data);
            } catch(err) {
                callback({errno:-1007,message:'Parse json error'},'Parse json error');
            }
        });
    });

//在req对象上监听error事件
    req.on('error', (err) => {
        console.error('http request error:',err.message);
        callback(err,err.message);
    })

//将发送数据写入到req对象主体中
    req.write(postData);
    req.end();
}

function doGet(url, callback){
    logger.info("发送体:",url);
    var body = "";

    const req = https.get(url, (res) => {
        logger.info("状态码:",res.statusCode);
        logger.info("响应头:",JSON.stringify(res.headers));

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end',() => {
            try{
               // let data = JSON.parse(body);   //string -> json
                logger.info("响应体:", body);
                callback(null, body);
            } catch(err) {
                callback({errno:-1007, message:'Parse json error'}, 'Parse json error');
            }
        });
    });


}


function doPost2(options,data,callback){
    var body = "";
    var postData = querystring.stringify(data);
    //logger.info("发送头:",options);
    logger.info("发送体:",postData);

    const req = http.request(options, (res) => {
        logger.info("状态码:",res.statusCode);
        logger.info("响应头:",JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end',() => {
            try{
                let data = JSON.parse(body);   //string -> json
                logger.info("响应体:",JSON.stringify(data));
                // logger.info("Cookie:",res.headers['set-cookie']);
                callback(null,data,res.headers['set-cookie']);
            }catch(err){
                callback({errno:-1007,message:'Parse json error'},'Parse json error');
            }
        });
    });

//在req对象上监听error事件
    req.on('error', (err) => {
        console.error('http request error:',err.message);
        callback(err,err.message);
    })

//将发送数据写入到req对象主体中
    req.write(postData);
    req.end();
}

function doGetByProxy (url, callback) {
    const fetch = require("node-fetch");
    const HttpsProxyAgent = require('https-proxy-agent');
    let ip='10.1.53.119';
    let port='6666';
    fetch(url, {
        method: 'GET',
        // body: null,
        redirect: 'follow',  // set to `manual` to extract redirect headers, `error` to reject redirect
        timeout: 10000,      //ms
        agent: new HttpsProxyAgent("http://guest:grg002152@" + ip + ":" + port) //<==注意是 `http://`
    }).then(function (res) {
        if (res.status != 200) {
            logger.error("request api.weixin failed: " + JSON.stringify(res));
            return callback(result.err_code.ERR_WECHAT_API_CALL_FAILED);
        }
        logger.info("response header: " + JSON.stringify(res.headers));
        return res.text();
    }).then(function (res) {
        callback(null, res);
    });
}


module.exports = {
    doPost,
    doPost2,
    doGet,
    doGetByProxy,
}

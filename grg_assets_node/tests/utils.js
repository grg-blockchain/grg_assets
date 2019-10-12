var http = require('http');
var queryString = require('querystring');

/**
 * 带参数发post请求
 */
exports.doPost = function(option, data, next){
    var body = '';
    var req = http.request(option, function(res){
        res.statusCode == 200 && console.log('REQUEST OK..' );
        res.setEncoding('utf8');//res为ClientResponse的实例，是readableStream, 设置字符编码

        res.on('data', function(chunk){
            body += chunk;
        }).on('end', function(){
            console.log('Got data: ', body);//end事件中 打印全部响应数据
            if (next) {
                return next(null, body, res.headers);
            }
        });
    }).on('error', function(err){
        console.log('error: ', err.message);
    });


    data = queryString.stringify(data); //注意 querystring.stringify 和 JSON.stringify的区别

    req.write(data); //req为ClientRequest的实例，是writableStream，写数据到流中
    req.end();//结束请求
};


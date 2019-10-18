var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('./config');
var thislogger = require('./common/log')("app");
var result = require('./common/result')();

var donotNeedLogin = [
    '/wechat/login',
    '/common/upload',
    '/user_account/login',
    '/logout',
    '/',
];

var app = express();

//allow custom header and CORS
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

    if (req.method == 'OPTIONS') {

        console.log("OPTIONS receive");
        // res.sendStatus(200); //让options请求快速返回
        res.send('ok');
    }
    else {
        next();
    }
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var session = require('express-session');
var RedisStrore = require('connect-redis')(session);
app.use(session({
    name : "sid",
    secret : 'grg_score_node',
    resave : false,
    rolling: true,
    saveUninitialized : false,
    cookie : config.cookie,
    store : new RedisStrore(config.sessionStore)
}));

app.use(function (req, res, next) {
    thislogger.info("req: " + req.url + ", method: " + req.method + ", params: " + JSON.stringify(req.query) + JSON.stringify(req.body));
    thislogger.info("req headers: " + JSON.stringify(req.headers));

    if (req.url.substr(0, '/sp_api/'.length) === '/sp_api/' || donotNeedLogin.indexOf(req.url) >= 0 ||
        (req.session.key && req.session.iv)) {

    }
    else {
        return res.send(result.Result({}, result.err_code.ERR_NEED_LOGIN));
    }

    next();
});


app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/user_account', require('./routes/user_account'));
app.use('/user_assets', require('./routes/user_assets'));
app.use('/user_trans', require('./routes/user_trans'));
app.use('/wechat', require('./routes/wechat'));
app.use('/sp_api', require('./routes/sp_api'));
app.use('/mall', require('./routes/mall'));
app.use('/film', require('./routes/film'));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

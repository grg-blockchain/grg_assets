const User = require('./controller/user');
const router = require('koa-router')({prefix: '/api/v1', sensitive: true});
router.get('/user', User.info);



module.exports = router;
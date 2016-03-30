var express = require('express')
var apiRouter = express.Router()

var AuthCtrl = require('../controllers/authentication')
var StylesCtrl = require('../controllers/styles')
var TilesetsCtrl = require('../controllers/tilesets')
var UploadsCtrl = require('../controllers/uploads')

/* 添加路由验证 */
var jwt = require('express-jwt');
var auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload'
})

/* API根引导*/
apiRouter.get('/', function(req,res) {
  res.json({status:200,
  success:'ok',
  style:'/style',
  icons:'/icon',
  tileset:'/tileset',
  upload:'/upload'})
})

/* 用户注册登录API */
apiRouter.post('/register', AuthCtrl.register)
apiRouter.post('/login',AuthCtrl.login)

/* 矢量瓦片操作API */


/* 样式文件API，一期核心部分 */
apiRouter.get('/style',StylesCtrl.viewStyleList)

/* 上传数据API */


/* 符号API */


module.exports = apiRouter



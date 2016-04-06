var express = require('express')
var apiRouter = express.Router()

var AuthCtrl = require('../controllers/authentication')
var StylesCtrl = require('../controllers/styles')
var TilesetsCtrl = require('../controllers/tilesets')
var UploadsCtrl = require('../controllers/uploads')

/* 验证方案一、添加路由验证 */
var jwt = require('express-jwt')
var auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload',
  getToken: function catchToken(req) {
    var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token']
    if(access_token) {
      return access_token
    } else {
      return null
    }
  }
})

/* API根引导 */
apiRouter.get('/', function(req,res) {
  res.status(200).json({
  style:'http://localhost:11111/api/style',
  icons:'http://localhost:11111/api/icon',
  tileset:'http://localhost:11111/api/tileset',
  upload:'http://localhost:11111/api/upload'})
})

/* 用户注册登录API */
apiRouter.post('/register', AuthCtrl.register)
apiRouter.post('/login',AuthCtrl.login)

/* upload */
apiRouter.post('/upload',UploadsCtrl.uploadFile)

/* 矢量瓦片操作API，公有数据不需要验证，用户瓦片需要验证，且只能新建和更新 */
apiRouter.get('/tileset',auth,TilesetsCtrl.viewTileList)

/* 验证方案二、以下api都需要，验证token，并decode信息获得payload，自动添加到req请求体中 */
// apiRouter.use('*',AuthCtrl.verify)

apiRouter.get('/tileset/:username',auth,TilesetsCtrl.viewUserTileList)
apiRouter.get('/tileset/:username/:tilesetid',auth,TilesetsCtrl.viewTile)
apiRouter.post('/tileset/:username',TilesetsCtrl.newTile)
apiRouter.delete('/tileset/:username/:tilesetid',TilesetsCtrl.deleteTile)


/* 样式文件API，一期核心部分,需要验证，添加Auth中间件 */
apiRouter.get('/style',StylesCtrl.viewStyleList)
apiRouter.get('/style/:username',StylesCtrl.viewUserStyleList)
apiRouter.post('/style/:username',StylesCtrl.newStyle)
apiRouter.get('/style/:username/:styleid',StylesCtrl.viewStyle)
apiRouter.put('/style/:username/:styleid',StylesCtrl.updateStyle)
apiRouter.delete('/style/:username/:styleid',StylesCtrl.deleteStyle)

/* 上传数据API,需要验证，添加Auth中间件 */


/* 符号API,需要验证，添加Auth中间件 */


module.exports = apiRouter



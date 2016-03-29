var bodyParser = require('body-parser')
var Tileset = require('../models/tileset')
var Style = require('../models/style')
var Upload = require('../models/upload')

module.exports = function(app, express) {
  var apiRouter = express.Router()


  /* 上面对访问接口进行验证 */

  apiRouter.get('/', function(req,res) {
    res.json({status:200,
      success:'ok'})
  })

/* 对数据集的操作 */
  apiRouter.route('/tileset')

    .get(function(req, res) {
      res.json({
        'method':'请求tilesets数据',
        'success': 'ok'
      })
    })

/* 对样式文件的操作 */
  apiRouter.route('/style')

    .get(function(req, res) {
      /* code goes here */
      res.json({
        method:'你现在在请求样式style文件',
        success: 'ok'
      })
    })

    /* 新建并返回完整style */
    .post(function(req, res) {
      /* code goes here */

      /* 获取提交的表单，保存style数据 */
      console.log(req.body.info)

      /* 解析style文件，并保存到mongodb */
      var style = req.body.info

      res.json({
        method: '你现在在新建一份样式文件',
        success: 'ok'
      })
    })


    .put(function(req, res) {
      /* code goes here */
      res.json({
        method: '你现在在更新一份样式文件',
        success: 'ok'
      })
    })


    .delete(function(req, res) {
      /* code goes here */
      res.json({
        method: '你现在在删除一份样式文件',
        success: 'ok'
      })
    })

    return apiRouter
}

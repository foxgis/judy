var bodyParser = require('body-parser')
var Tilesets = require('../models/tilesets')

module.exports = function(app, express) {
  var apiRouter = express.Router()

  apiRouter.get('/', function(req,res) {
    res.json({status:200,
      success:'ok'})
  })

  apiRouter.route('/tilesets')

    .get(function(req, res) {
      res.json({
        'method':'请求tilesets数据',
        'success': 'ok'
      })
    })

    return apiRouter
}

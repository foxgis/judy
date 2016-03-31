var Style = require('../models/style')
var bodyParser = require('body-parser')

var sendJSONresponse = function(res, status, content) {
  res.status(status)
  res.json(content)
}

module.exports.viewStyleList = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在查看style列表'
  })
}

module.exports.viewUserStyleList = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在查看用户style列表'
  })
}

module.exports.newStyle = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在新建样式'
  })
}

module.exports.updateStyle = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在更新样式'
  })
}

module.exports.deleteStyle = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在删除样式'
  })
}






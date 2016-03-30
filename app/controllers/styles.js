var mongoose = require('mongoose')
var Style = require('../models/style')
var bodyParser = require('body-parser')

var sendJSONresponse = function(res, status, content) {
  res.status(status)
  res.json(content)
}

module.exports.viewStyleList = function(req,res) {
  sendJSONresponse(res,200,{
    'message':'你正在查看style列表'
  })
}






var Tileset = require('../models/tileset')
var bodyParser = require('body-parser')

var sendJSONresponse = function(res, status, content) {
  res.status(status)
  res.json(content)
}

module.exports.viewTileList = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在查看Tile列表'
  })
}

module.exports.viewUserTileList = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在查看用户Tile列表',
    'username':req.decoded.username,
    _id:req.decoded._id
  })
}

module.exports.newTile = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在新建Tile'
  })
}

module.exports.viewTile = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在查看Tile',
    'username':req.params.username,
    'id':req.params.tilesetid
  })
}

module.exports.deleteTile = function(req, res) {
  sendJSONresponse(res,200,{
    'message':'你正在删除Tile'
  })
}

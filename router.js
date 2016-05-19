var express = require('express')
var multer = require('multer')
var util = require('util')
var auth = require('./controllers/auth')
var users = require('./controllers/user')
var uploads = require('./controllers/upload')
var styles = require('./controllers/style')
var tilesets = require('./controllers/tileset')
var fonts = require('./controllers/font')
var sprites = require('./controllers/sprite')
var groups = require('./controllers/group')
var admin = require('./controllers/admin')


var router = express.Router()
var upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 200000000, files: 1 }
})

// 用户
router.post('/users', users.create)
router.get('/users/:username', auth, users.retrieve)
router.patch('/users/:username', auth, users.update)
router.post('/users/:username', users.login)

// 群组
router.get('/groups/:username', auth, groups.list)
router.post('/groups/:username', auth, groups.create)
router.get('/groups/:username/:group_id', auth, groups.retrieve)
router.patch('/groups/:username/:group_id', auth, groups.update)
router.delete('/groups/:username/:group_id', auth, groups.delete)

// 上传文件
router.get('/uploads/:username', auth, uploads.list)
router.post('/uploads/:username', auth, upload.any(), uploads.create)
router.get('/uploads/:username/:upload_id', auth, uploads.retrieve)
router.get('/uploads/:username/:upload_id/raw', auth, uploads.download)
router.delete('/uploads/:username/:upload_id', auth, uploads.delete)

var floatPattern = '[+-]?(?:\\d+|\\d+\.?\\d+)'
var staticPattern = '/static/%s:scale(@[23]x)?\.:format([\\w\\.]+)'
var centerPattern = util.format(':lon(%s),:lat(%s),:z(\\d+)/:width(\\d+)x:height(\\d+)',
  floatPattern, floatPattern)
var boundsPattern = util.format(':minx(%s),:miny(%s),:maxx(%s),:maxy(%s)/:z(\\d+)',
  floatPattern, floatPattern, floatPattern, floatPattern)

// 样式
router.get('/styles', auth, styles.search)
router.get('/styles/:username', auth, styles.list)
router.post('/styles/:username', auth, styles.create)
router.get('/styles/:username/:style_id', auth, styles.retrieve)
router.get('/styles/:username/:tileset_id' + util.format(staticPattern, centerPattern), auth, styles.retrieve)
router.get('/styles/:username/:tileset_id' + util.format(staticPattern, boundsPattern), auth, styles.retrieve)
router.patch('/styles/:username/:style_id', auth, styles.update)
router.delete('/styles/:username/:style_id', auth, styles.delete)

// 瓦片集
router.get('/tilesets', auth, tilesets.search)
router.get('/tilesets/:username', auth, tilesets.list)
router.get('/tilesets/:username/:tileset_id', auth, tilesets.retrieve)
router.get('/tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[23]x)?.:format([\\w\\.]+)', auth, tilesets.getTile)
router.get('/tilesets/:username/:tileset_id' + util.format(staticPattern, centerPattern), auth, tilesets.preview)
router.get('/tilesets/:username/:tileset_id' + util.format(staticPattern, boundsPattern), auth, tilesets.preview)
router.patch('/tilesets/:username/:tileset_id', auth, tilesets.update)
router.delete('/tilesets/:username/:tileset_id', auth, tilesets.delete)

// 字体
router.get('/fonts/:username', auth, fonts.list)
router.get('/fonts/:username/:fontstack/:range.pbf', auth, fonts.retrieve)

// 符号库
router.get('/sprites/:username', auth, sprites.list)
router.get('/sprites/:username/:sprite_id', auth, sprites.retrieve)
router.get('/sprites/:username/:sprite_id/sprite:scale(@[2]x)?.:format([\\w\\.]+)?', auth, sprites.download)
router.patch('/sprites/:username/:sprite_id', auth, sprites.update)
router.delete('/sprites/:username/:sprite_id', auth, sprites.delete)

// 行政区划
router.get('/admin.json', admin.retrieve)

module.exports = router

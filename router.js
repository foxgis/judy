var express = require('express')
var multer = require('multer')
var util = require('util')
var auth = require('./controllers/auth')
var users = require('./controllers/user')
var styles = require('./controllers/style')
var tilesets = require('./controllers/tileset')
var fonts = require('./controllers/font')
var sprites = require('./controllers/sprite')
var uploads = require('./controllers/upload')
var stats = require('./controllers/stat')


var router = express.Router()
var upload = multer({
  dest: 'uploads/',
  limits: { fieldSize: 200000000, files: 1 }
})

var floatPattern = '[+-]?(?:\\d+|\\d+\.?\\d+)'
var staticPattern = '/static/%s:scale(@[23]x)?\.:format([\\w\\.]+)'
var centerPattern = util.format(':lon(%s),:lat(%s),:z(\\d+)/:width(\\d+)x:height(\\d+)',
  floatPattern, floatPattern)
var boundsPattern = util.format(':minx(%s),:miny(%s),:maxx(%s),:maxy(%s)/:z(\\d+)',
  floatPattern, floatPattern, floatPattern, floatPattern)

// 用户
router.post('/users', users.create)
router.get('/users/:username', auth, users.retrieve)
router.patch('/users/:username', auth, users.update)
router.post('/users/:username', users.login)

// 样式
router.get('/styles/:username', auth, styles.list)
router.post('/styles/:username', auth, styles.create)
router.get('/styles/:username/:style_id', auth, styles.retrieve)
router.patch('/styles/:username/:style_id', auth, styles.update)
router.delete('/styles/:username/:style_id', auth, styles.delete)
router.get('/styles/:username/:tileset_id' + util.format(staticPattern, centerPattern), auth, styles.preview)
router.get('/styles/:username/:tileset_id' + util.format(staticPattern, boundsPattern), auth, styles.preview)
router.get('/styles', auth, styles.search)

// 瓦片集
router.get('/tilesets/:username', auth, tilesets.list)
router.post('/tilesets/:username', auth, upload.any(), tilesets.create)
router.get('/tilesets/:username/:tileset_id', auth, tilesets.retrieve)
router.patch('/tilesets/:username/:tileset_id', auth, tilesets.update)
router.delete('/tilesets/:username/:tileset_id', auth, tilesets.delete)
router.get('/tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[2]x)?\.:format([\\w\\.]+)', auth, tilesets.getTile)
router.get('/tilesets/:username/:tileset_id' + util.format(staticPattern, centerPattern), auth, tilesets.preview)
router.get('/tilesets/:username/:tileset_id' + util.format(staticPattern, boundsPattern), auth, tilesets.preview)
router.get('/tilesets', auth, tilesets.search)

// 字体
router.get('/fonts/:username', auth, fonts.list)
router.post('/fonts/:username', auth, upload.any(), fonts.create)
router.get('/fonts/:username/:fontname', auth, fonts.retrieve)
router.patch('/fonts/:username/:fontname', auth, fonts.update)
router.delete('/fonts/:username/:fontname', auth, fonts.delete)
router.get('/fonts/:username/:fontname/:range.pbf', auth, fonts.download)
router.get('/fonts/:username/:fontname/raw', auth, fonts.downloadRaw)
router.get('/fonts/:username/:fontname/:color:scale(@[2]x)?', auth, fonts.preview)

// 符号库
router.get('/sprites/:username', auth, sprites.list)
router.post('/sprites/:username', auth, upload.any(), sprites.create)
router.get('/sprites/:username/:sprite_id', auth, sprites.retrieve)
router.patch('/sprites/:username/:sprite_id', auth, sprites.update)
router.delete('/sprites/:username/:sprite_id', auth, sprites.delete)
router.get('/sprites/:username/:sprite_id/sprite:scale(@[2]x)?.:format([\\w\\.]+)?', auth, sprites.download)

// 上传文件库
router.get('/uploads/:username', auth, uploads.list)
router.post('/uploads/:username', auth, upload.any(), uploads.create)
router.get('/uploads/:username/:upload_id', auth, uploads.retrieve)
router.patch('/uploads/:username/:upload_id', auth, uploads.update)
router.delete('/uploads/:username/:upload_id', auth, uploads.delete)
router.get('/uploads/:username/:upload_id/file', auth, uploads.download)
router.get('/uploads/:username/:upload_id/thumbnail', auth, uploads.getThumbnail)
router.get('/uploads/:username/:upload_id/mini_thumbnail', auth, uploads.getMiniThumbnail)
router.get('/uploads', auth, uploads.search)

// 统计信息
router.get('/stats/uploads', auth, stats.uploads)


module.exports = router

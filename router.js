var express = require('express')
var multer = require('multer')
var auth = require('./controllers/auth')
var users = require('./controllers/user')
var uploads = require('./controllers/upload')
var styles = require('./controllers/style')
var tilesets = require('./controllers/tileset')
var fonts = require('./controllers/font')
var sprites = require('./controllers/sprite')

var router = express.Router()
var upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 200000000, files: 1 }
})

// 用户
router.post('/users', users.create)
router.get('/users/:username', auth, users.retrieve)
router.patch('/users/:username', auth, users.update)
router.post('/users/:username', auth, users.login)

// 上传文件
router.get('/uploads/:username', auth, uploads.list)
router.post('/uploads/:username', upload.any(), auth, uploads.create)
router.get('/uploads/:username/:upload_id', auth, uploads.retrieve)
router.delete('/uploads/:username/:upload_id', auth, uploads.delete)

// 样式
router.get('/styles/:username', auth, styles.list)
router.post('/styles/:username', auth, styles.create)
router.get('/styles/:username/:style_id', auth, styles.retrieve)
router.patch('/styles/:username/:style_id', auth, styles.update)
router.delete('/styles/:username/:style_id', auth, styles.delete)

// 瓦片集
router.get('/tilesets/:username', auth, tilesets.list)
router.get('/tilesets/:username/:tileset_id', auth, tilesets.retrieve)
router.get('/tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[23]x)?.:format([\\w\\.]+)', auth, tilesets.getTile)
router.delete('/tilesets/:username/:tileset_id', auth, tilesets.delete)

// 字体
router.get('/fonts/:username', auth, fonts.list)
router.get('/fonts/:username/:fontstack/:range.pbf', auth, fonts.retrieve)

// 符号库
router.get('/sprites/:username', auth, sprites.list)
router.get('/sprites/:username/:sprite_id:scale(@[2]x)?.:format([\\w\\.]+)?', auth, sprites.retrieve)


module.exports = router

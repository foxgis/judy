var express = require('express')
var multer = require('multer')
var auth = require('./controllers/auth')
var users = require('./controllers/user')
var styles = require('./controllers/style')
var tilesets = require('./controllers/tileset')
var fonts = require('./controllers/font')
var sprites = require('./controllers/sprite')
var files = require('./controllers/file')
var uploads = require('./controllers/upload')
var stats = require('./controllers/stat')
var templates = require('./controllers/template')

var router = express.Router()
var upload = multer({
  dest: 'uploads/',
  limits: { fieldSize: 200000000, files: 1 }
})

// 用户
router.get('/users', auth, users.list)
router.post('/users', users.create)
router.post('/users/:username', users.login)
router.get('/users/:username', auth, users.retrieve)
router.delete('/users/:username', auth, users.delete)
router.patch('/users/:username', auth, users.update)
router.patch('/users/:username/password', auth, users.updatePassword)
router.put('/users/:username/avatar', auth, upload.any(), users.uploadAvatar)
router.get('/users/:username/avatar', auth, users.downloadAvatar)

// 样式
router.get('/styles/:username', auth, styles.list)
router.get('/styles/:username/:style_id', auth, styles.retrieve)
router.post('/styles/:username', auth, styles.create)
router.patch('/styles/:username/:style_id', auth, styles.update)
router.delete('/styles/:username/:style_id', auth, styles.delete)
router.get('/styles/:username/:style_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[1-4]x)?\.:format([\\w\\.]+)', styles.downloadTile)
router.get('/styles/:username/:style_id/thumbnail', auth, styles.preview)

// 瓦片集
router.get('/tilesets', auth, tilesets.listAll)
router.get('/tilesets/:username', auth, tilesets.list)
router.get('/tilesets/:username/:tileset_id', tilesets.retrieve)
router.post('/tilesets/:username', auth, upload.any(), tilesets.upload)
router.patch('/tilesets/:username/:tileset_id', auth, tilesets.update)
router.delete('/tilesets/:username/:tileset_id', auth, tilesets.delete)
router.get('/tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[1-4]x)?\.:format([\\w\\.]+)', tilesets.downloadTile)
router.get('/tilesets/:username/:tileset_id/raw', auth, tilesets.downloadRaw)

// 字体
router.get('/fonts/:username', auth, fonts.list)
router.get('/fonts/:username/:fontname', auth, fonts.retrieve)
router.post('/fonts/:username', auth, upload.any(), fonts.upload)
router.patch('/fonts/:username/:fontname', auth, fonts.update)
router.delete('/fonts/:username/:fontname', auth, fonts.delete)
router.get('/fonts/:username/:fontname/:range.pbf', fonts.download)
router.get('/fonts/:username/:fontname/raw', auth, fonts.downloadRaw)
router.get('/fonts/:username/:fontname/thumbnail', auth, fonts.preview)

// 符号库
router.get('/sprites', auth, sprites.listAll)
router.get('/sprites/:username', auth, sprites.list)
router.get('/sprites/:username/:sprite_id', auth, sprites.retrieve)
router.post('/sprites/:username', auth, upload.any(), sprites.upload)
router.put('/sprites/:username/:sprite_id/:icon', auth, upload.any(), sprites.uploadIcon)
router.patch('/sprites/:username/:sprite_id', auth, sprites.update)
router.delete('/sprites/:username/:sprite_id', auth, sprites.delete)
router.delete('/sprites/:username/:sprite_id/:icon', auth, sprites.deleteIcon)
router.get('/sprites/:username/:sprite_id/sprite:scale(@[1-4]x)?.:format([\\w\\.]+)?', sprites.download)
router.get('/sprites/:username/:sprite_id/raw', auth, sprites.downloadRaw)
router.get('/sprites/:username/:sprite_id/:icon', auth, sprites.downloadIcon)

// 上传文件库
router.get('/files/stats', auth, files.stats)
router.get('/files/search', auth, files.search)
router.get('/files/:username', auth, files.list)
router.get('/files/:username/:file_id', auth, files.retrieve)
router.post('/files/:username', auth, upload.any(), files.upload)
router.patch('/files/:username/:file_id', auth, files.update)
router.delete('/files/:username/:file_id', auth, files.delete)
router.get('/files/:username/:file_id/raw', auth, files.downloadRaw)
router.get('/files/:username/:file_id/thumbnail', auth, files.preview)


router.get('/uploads/excel', auth, uploads.excel)
router.get('/uploads/:username', auth, uploads.list)
router.get('/uploads/:username/download', auth, uploads.downloadAll)
router.post('/uploads/:username', auth, upload.any(), uploads.upload)
router.get('/uploads/:username/:upload_id', auth, uploads.retrieve)
router.patch('/uploads/:username/:upload_id', auth, uploads.update)
router.delete('/uploads/:username', auth, uploads.remove)
router.delete('/uploads/:username/:upload_id', auth, uploads.delete)
router.get('/uploads/:username/:upload_id/file', auth, uploads.download)
router.get('/uploads/:username/:upload_id/thumbnail', auth, uploads.getThumbnail)
router.get('/uploads/:username/:upload_id/mini_thumbnail', auth, uploads.getMiniThumbnail)
router.get('/uploads', auth, uploads.search)

//统计
router.get('/stats/uploads', auth, stats.uploads)
router.get('/stats/userdownloads', auth, stats.userdownloads)
router.get('/stats/filedownloads', auth, stats.filedownloads)
router.get('/stats/location', auth, stats.location)
router.get('/stats/year', auth, stats.year)
router.get('/stats/tags', auth, stats.tags)

//模板
router.get('/templates', auth, templates.list)
router.post('/templates/:username', auth, upload.any(), templates.upload)
router.get('/templates/:username/:template_id', auth, templates.retrieve)
router.get('/templates/:username/:template_id/json', auth, templates.getJSON)
router.delete('/templates/:username/:template_id', auth, templates.delete)
router.patch('/templates/:username/:template_id', auth, templates.update)
router.put('/templates/:username/:template_id', auth, upload.any(), templates.updatejson)
router.post('/templates/:username/:template_id/image', auth, upload.any(), templates.postImage)
router.get('/templates/:username/:template_id/image', auth, templates.getImage)



module.exports = router

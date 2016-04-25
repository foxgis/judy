var path = require('path')
var AdmZip = require('adm-zip')
var json = require('./json')
var mbtiles = require('./mbtiles')
var shapefile = require('./shapefile')
var sprite = require('./sprite')


module.exports = function(req) {
  var ext = path.extname(req.files[0].originalname).toLowerCase()

  if (ext === '.json' || ext === '.geojson') {
    json(req)
    return
  }

  if (ext === '.mbtiles') {
    mbtiles(req)
    return
  }

  if (ext === '.zip') {
    var zip = new AdmZip(req.files[0])
    var zipEntries = zip.getEntries()
    var exts = zipEntries.map(function(entry) {
      return path.extname(entry.entryName).toLowerCase()
    })

    if (exts.includes('.shp') && exts.includes('.shx') && exts.includes('.dbf')) {
      shapefile(req)
      return
    }

    if (exts.includes('.png') && exts.includes('.json')) {
      sprite(req)
      return
    }
  }

  req.upload.complete = true
  req.upload.progress = 1
  req.upload.error = '文件格式不支持，未能进一步处理'
}

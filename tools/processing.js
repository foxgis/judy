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
    var zip = new AdmZip(req.files[0].path)
    var exts = zip.getEntries().map(function(entry) {
      return path.extname(entry.entryName).toLowerCase()
    })

    if ((exts.indexOf('.shp') >= 0) && (exts.indexOf('.shx') >= 0) && (exts.indexOf('.dbf') >= 0)){
      shapefile(req)
      return
    }

    if ((exts.indexOf('.png') >= 0) && (exts.indexOf('.json') >= 0)) {
      sprite(req)
      return
    }
  }

  req.upload.complete = true
  req.upload.progress = 1
  req.upload.error = '文件格式不支持，未能进一步处理'
  req.upload.save()
}

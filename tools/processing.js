// var path = require('path')
// var AdmZip = require('adm-zip')
// var geojson = require('./geojson')
// var mbtiles = require('./mbtiles')
// var shapefile = require('./shapefile')
// var sprite = require('./sprite')


// module.exports = function(req) {
//   var ext = path.extname(req.files[0].originalname).toLowerCase()

//   if (ext === '.json' || ext === '.geojson') {
//     geojson(req)

//   } else if (ext === '.mbtiles') {
//     mbtiles(req.params.username, req.files[0].path, function(err, tileset_id) {
//       if (err) {
//         req.upload.error = err
//       } else {
//         req.upload.tileset_id = tileset_id
//       }
//     })

//   } else if (ext === '.zip') {
//     var zip = new AdmZip(req.files[0].path)
//     var zipEntries = zip.getEntries()
//     var exts = zipEntries.map(function(entry) {
//       return path.extname(entry.entryName).toLowerCase()
//     })

//     if (exts.indexOf('.shp') > -1 && exts.indexOf('.shx') > -1 &&
//       exts.indexOf('.dbf') > -1) {
//       shapefile(req)
//     }

//     if (exts.indexOf('.svg') > -1) {
//       sprite(req.params.username, req.files[0].path, function(err, sprite_id) {
//         if (err) {
//           req.upload.error = err
//         } else {
//           req.upload.sprite_id = sprite_id
//         }
//       })
//     }

//   } else {
//     req.upload.error = '文件格式不支持，未能进一步处理'
//   }

//   req.upload.complete = true
//   req.upload.progress = 1
//   req.upload.save()
// }

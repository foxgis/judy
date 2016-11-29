var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var async = require('async')
var sharp = require('sharp')
var Grid = require('gridfs-stream')
var Upload = require('../models/upload')
var User = require('../models/user')
var JSZip = require('jszip')
var XLSX = require('xlsx')


//该模块包含了对上传图片功能进行业务处理的各项函数

module.exports.list = function(req, res) {
  var query = {
    owner: req.params.username,
    is_deleted: false 
  }

  if (req.user.username !== req.params.username && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    query.scope = 'public'
  }

  Upload.find(query, '-_id -__v -file_id -is_deleted -thumbnail -mini_thumbnail', function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(uploads)
  }).sort({ createdAt: -1 })
}


module.exports.upload = function(req, res) {
  var gfs = Grid(mongoose.connection.db, mongoose.mongo)
  var writeStream = gfs.createWriteStream({
    filename: req.files[0].originalname
  })
  fs.createReadStream(req.files[0].path).pipe(writeStream)

  writeStream.on('error', function(err) {
    fs.unlink(req.files[0].path)
    return res.status(500).json({ error: err })
  })

  writeStream.on('close', function(file) {
    var format = path.extname(file.filename).replace('.', '').toLowerCase()
    var newUpload = new Upload({
      file_id: file._id,
      owner: req.params.username,
      name: path.basename(file.filename, path.extname(file.filename)),
      size: req.files[0].size,
      format: format
    })

    if (req.body.year) newUpload.year = req.body.year
    if (req.body.location) newUpload.location = req.body.location
    if (req.body.scale) newUpload.scale = req.body.scale

    if (['png', 'jpg', 'jpeg', 'gif', 'tiff', 'tif'].indexOf(newUpload.format) < 0) {
      newUpload.save(function(err) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        fs.unlink(req.files[0].path)
        return res.status(200).json(newUpload)
      })
    } else {
      fs.readFile(req.files[0].path, function(err, imageBuffer) {
        fs.unlink(req.files[0].path)
        var image = sharp(imageBuffer)

        async.parallel([
          function(callback) {
            image.metadata(function(err, metadata) {
              var dpi = metadata.density || 72
              var width = Math.round(metadata.width / dpi * 25.4)
              var height = Math.round(metadata.height / dpi * 25.4)

              callback(err, [height, width])
            })
          },

          function(callback) {
            image.resize(300, 300).quality(50).jpeg().toBuffer(function(err, buffer) {
              callback(err, buffer)
            })
          },

          function(callback) {
            image.metadata(function(err, metadata) {
              if (metadata.width <= 1000) {
                image.quality(50).jpeg().toBuffer(function(err, buffer) {
                  callback(err, buffer)
                })
              } else {
                image.resize(1000).quality(50).jpeg().toBuffer(function(err, buffer) {
                  callback(err, buffer)
                })
              }
            })
          }
        ], function(err, results) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          newUpload.dimensions = results[0]
          newUpload.mini_thumbnail = results[1]
          newUpload.thumbnail = results[2]

          newUpload.save(function(err) {
            if (err) {
              return res.status(500).json({ error: err })
            }

            return res.status(200).json(newUpload)
          })
        })
      })
    }
  })
}


module.exports.retrieve = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    res.status(200).json(upload)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'name', 'location', 'scale', 'dimensions', 'year', 'tags', 'description']

  Upload.findOneAndUpdate({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    res.status(200).json(upload)
  })
}

module.exports.updateDownload = function(req, res) {

  Upload.find({is_deleted:false},function(err,uploads){
    uploads.forEach(function(upload) {
      var random = parseInt(Math.random()*100+1,10)
      User.findOneAndUpdate({
        upload_id: upload.upload_id
      }, {$set:{downloadNum:random}}, function(err) {
        if (err) {
          return
        }
      })
    })
  })
}

module.exports.delete = function(req, res) {
  Upload.findOneAndUpdate({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.remove = function(req, res) {
  if (req.query.username || req.query.upload_id) {
    var gfs = Grid(mongoose.connection.db, mongoose.mongo)
    var query = { is_deleted: true }
    if (req.query.username) {
      query.owner = req.query.username
    }

    if (req.query.upload_id) {
      query.upload_id = req.query.upload_id
    }

    Upload.find(query).lean().exec(function(err, uploads) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      async.autoInject({
        removeGFS: function(callback){
          async.each(uploads, function(upload, next) {
            gfs.remove({ _id: upload.file_id }, next)
          }, callback)
        },
        removeDB: function(callback){
          Upload.remove(query, callback)
        }
      },function(err) {
        if (err) {
          return res.status(500).json({ error: err })
        } else {
          res.sendStatus(204)
        }
      })

    })
  } else {
    res.status(500).json({ error:'缺少图集信息'})
  }

}


module.exports.download = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload) {
      return res.sendStatus(404)
    }

    var gfs = Grid(mongoose.connection.db, mongoose.mongo)
    var readStream = gfs.createReadStream({ _id: upload.file_id })
    readStream.on('error', function(err) {
      return res.status(500).json({ error: err })
    })

    res.set('Content-disposition', 'attachment; filename*=UTF-8\'\'' +
      encodeURIComponent(upload.name) + '.' + encodeURIComponent(upload.format))
    res.type(upload.format)
    readStream.pipe(res)

    readStream.on('end', function() {
      Upload.findOneAndUpdate({
        upload_id: req.params.upload_id,
        owner: req.params.username
      }, { $inc: { downloadNum: 1} }, { new: true }, function(err) {
        if (err) {
          return 
        }
      })


      User.findOneAndUpdate({
        username: req.params.username
      }, { $inc: { downloadNum: 1} }, { new: true }, function(err) {
        if (err) {
          return
        }
      })

      Upload.findOne({
        upload_id: req.params.upload_id
      }, function(err, upload) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        if (!upload) {
          return res.sendStatus(404)
        }
        var owner = upload.owner
        var location = upload.location
        var year = upload.year
        var tags = upload.tags

        User.findOne({
          username: owner
        }, function(err,user) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!user) {
            return res.sendStatus(404)
          }

          var isYear = false
          for(var i=0;i<user.statYears.length;i++){
            isYear = false
            if(user.statYears[i].name === year){
              user.statYears[i].count += 1
              isYear = true
              break
            }
          }
          if(!isYear){
            var tempStat = {
              name: year,
              count: 1
            }
            user.statYears.push(tempStat)
          }
          User.findOneAndUpdate({
            username: owner
          }, { statYears: user.statYears}, { new: true }, function(err) {
            if (err) {
              return
            }
          })

          var isLocation = false
          for(var i=0;i<user.statMaplands.length;i++){
            isLocation = false
            if(user.statMaplands[i].name === location){
              user.statMaplands[i].count += 1
              isLocation = true
              break
            }
          }
          if(!isLocation){
            var tempStat = {
              name: location,
              count: 1
            }
            user.statMaplands.push(tempStat)
          }
          User.findOneAndUpdate({
            username: owner
          }, { statMaplands: user.statMaplands}, { new: true }, function(err) {
            if (err) {
              return
            }
          })
          
          var isTag = false
          for(var j=0;j<tags.length;j++){
            var temptag = tags[j]
            for(var i=0;i<user.statTags.length;i++){
              isTag = false
              if(user.statTags[i].name === temptag){
                user.statTags[i].count += 1
                isTag = true
                break
              }
            }
            if(!isTag){
              var tempStat = {
                name: temptag,
                count: 1
              }
              user.statTags.push(tempStat)
            }
          }
          
          User.findOneAndUpdate({
            username: owner
          }, { statTags: user.statTags}, { new: true }, function(err) {
            if (err) {
              return
            }
          })

        })
      })

    })
  })
}


module.exports.getThumbnail = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload || !upload.thumbnail) {
      return res.sendStatus(404)
    }

    res.set({ 'Content-Type': 'image/jpeg' })
    res.status(200).send(upload.thumbnail)
  })
}


module.exports.getMiniThumbnail = function(req, res) {
  Upload.findOne({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, function(err, upload) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!upload || !upload.mini_thumbnail) {
      return res.sendStatus(404)
    }

    res.set({ 'Content-Type': 'image/jpeg' })
    res.status(200).send(upload.mini_thumbnail)
  })
}


module.exports.search = function(req, res) {
  var limit = +req.query.limit || 0
  var skip = +req.query.skip || 0
  var sort = req.query.sort

  var query = {}
  var querydata = null

  if (req.query.search) {
    querydata = req.query.search.trim().split(/\s+/g)
    if (querydata.length === 1) {
      query.$or = 
      [
          {name : {$regex : querydata[0] }},
          {location : {$regex : querydata[0] }},
          {tags : {$regex: querydata[0] }}
      ]

    } else {
      query.$and = 
      [
        { 
          $or: 
          [
            {name : {$regex : querydata[0] }},
            {location : {$regex : querydata[0] }},
            {tags : {$regex: querydata[0] }}
          ]},{
            $or: 
            [
            {name : {$regex : querydata[1] }},
            {location : {$regex : querydata[1] }},
            {tags : {$regex: querydata[1] }}
            ]
          }
      ]
    }
  }

  if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    query.scope = 'public'
    query.is_deleted = false
  }

  if (req.query.location) {
    var locationStr = req.query.location.replace('null','')
    query.location = { $in: locationStr.split(',')}
  }

  if (req.query.year) {
    var yearStr = req.query.year.replace('null','')
    query.year = { $in: yearStr.split(',')}
  }

  if (req.query.tags) {
    query.tags = { $in: req.query.tags.split(',')}
  }

  if (req.query.is_deleted) {
    query.is_deleted = req.query.is_deleted === 'true'
  }

  Upload.find(query,
    '-_id -__v -file_id -thumbnail -mini_thumbnail',
    function(err, uploads) {
      if (err) {
        return res.status(500).json({ error: err })
      }
      if (_.keys(uploads).length === 0 && querydata && querydata.length > 1) {
        Upload.find({
          $or : 
          [
          {name : {$regex : querydata[0] }},
          {location : {$regex : querydata[0] }},
          {tags : {$regex: querydata[0] }}
          ]},
          '-_id -__v -file_id -thumbnail -mini_thumbnail',
          function(err, uploads1) {
            if (err) {
              return res.status(500).json({ error: err })
            }

            res.status(200).json(uploads1)
          }).limit(limit).skip(skip).sort(sort)
      } else {
        res.status(200).json(uploads)
      }
    }).limit(limit).skip(skip).sort(sort)
}


module.exports.downloadAll = function(req, res) {
  var query = {}
  var downloadName = ''
  if (req.query.user) {
    query.owner = req.query.user.split(',')[0]
    downloadName += req.query.user.replace(/,/g,'_')
  }

  if (req.query.location) {
    query.location = req.query.location
    downloadName = downloadName + '_' + req.query.location
  }

  if (req.query.year) {
    query.year = req.query.year
    downloadName = downloadName + '_' + req.query.year
  }

  if (req.query.createdAt) {
    query.createdAt = { 
      $gte: new Date(parseInt(req.query.createdAt), 0, 1),
      $lt: new Date(parseInt(req.query.createdAt)+1, 0, 1)
    }
    downloadName = downloadName + '_' + req.query.createdAt
  }

  Upload.find(query).lean().exec(function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    var zip = new JSZip()
    var gfs = Grid(mongoose.connection.db, mongoose.mongo)
    async.autoInject({
      zipfile: function(callback) {
        async.each(uploads, function(upload, next) {
          var bufs = []
          var readStream = gfs.createReadStream({ _id: upload.file_id })
          readStream.on('error', function(err) {
            return callback(err, zip)
          }).on('data', function(chunk) {
            bufs.push(chunk)
          }).on('end', function(){
            var buf = Buffer.concat(bufs)
            var zipFileName = ''+upload.createdAt.getFullYear()+upload.createdAt.getMonth()+upload.createdAt.getDate()+
            upload.createdAt.getHours()+upload.createdAt.getMinutes()+upload.createdAt.getSeconds()+upload.createdAt.getMilliseconds()
            zip.file(upload.name + zipFileName + '.' + upload.format, buf)
            next()
          })
        }, callback)
      }
    }, function(err) {
      if (err) 
        return res.status(500).json({ error: err })
      res.set('Content-disposition', 'attachment; filename*=UTF-8\'\'' +
        encodeURIComponent(downloadName) + '.zip')
      res.set({ 'Content-Type': 'application/zip' })
      zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
      .pipe(res)
      .on('finish', function(){

        Upload.update(query, { $inc: { downloadNum: 1} }, { multi: true }, function(err) {
          if (err) {
            return 
          }
        })

        uploads.forEach(function(upload) {
          User.findOneAndUpdate({
            username: upload.owner
          }, { $inc: { downloadNum: 1} }, { new: true }, function(err) {
            if (err) {
              return
            }
          })
        })

      })
    })
  })
}


module.exports.excel = function(req, res) {

  var owners = ['Zhongtu01','Beijing11','Tianjin12','Hebei13','Shanxi14','Neimenggu15','Liaoning21','Jilin22','Heilongjiang23','Shanghai31',
  'Jiangsu32','Zhejiang33','Anhui34','Fujian35','Shandong37','Henan41','Hubei42','Hunan43','Guangdong44','Guangxi45','Chongqing50','Sichuan51',
  'Guizhou52','Yunnan53','Xizang54','Shanxi61','Gansu62','Qinghai63','Ningxia64','Xinjiang65','Jiangxi36','Hainan46']
  var headers = ['文件所有者', '姓名', '单位', '文件名', '制图区域', '制图时间', '比例尺', '图幅宽', '图幅高', '文件大小', '上传时间', '文件格式', '标签']
  
  var datas = []
  datas[0] = headers

  var pipeline = [{
    $match: { owner: {$in: owners} }
  }, {
    $lookup: { from: 'users', localField: 'owner', foreignField: 'username', as: 'users' }
  }, {
    $project: {
      _id: 0,
      owner: 1,
      name: 1,
      location: 1,
      year: 1,
      scale: 1,
      size: 1,
      createdAt: 1,
      format: 1,
      tags: 1,
      dimensions: 1,
      uname: { $arrayElemAt: ['$users.name', 0] },
      organization: { $arrayElemAt: ['$users.organization', 0] }
    }
  }, {
    $sort: { owner: -1, createdAt: -1 }
  }]
  Upload.aggregate(pipeline).exec(function(err, uploads) {
  //Upload.find({owner: {$in: owners}}, 'owner name location year scale size createdAt format').lean().sort({owner: -1}).exec(function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    async.autoInject({
      sheet: function(callback) {
        async.eachSeries(uploads, function(upload, next) {
          var temp = upload.createdAt.getFullYear()+'-'+(upload.createdAt.getMonth()+1)+'-'+upload.createdAt.getDate()+'-'+upload.createdAt.getHours()
          var data = [upload.owner,upload.uname,upload.organization,upload.name,upload.location,upload.year,upload.scale,upload.dimensions[1],upload.dimensions[0],upload.size,temp,upload.format,upload.tags.join(',')]
          datas.push(data)
          next()
        }, callback)
      }
    }, function(err) {
      if (err) 
        return res.status(500).json({ error: err })

      var ws_name = '用户上传图件信息'
      var wscols = [
        {wch:15},
        {wch:15},
        {wch:20},
        {wch:30},
        {wch:15},
        {wch:15},
        {wch:15},
        {wch:15},
        {wch:15},
        {wch:15},
        {wch:15},
        {wch:15},
        {wch:40}
      ]
      var wb = {
        SheetNames: [],
        Sheets: {}
      }


      var ws = sheet_from_array_of_arrays(datas)
      wb.SheetNames.push(ws_name)
      wb.Sheets[ws_name] = ws
      ws['!cols'] = wscols

      var wbbuf = XLSX.write(wb, { type: 'buffer' })

      res.set('Content-disposition', 'attachment; filename*=UTF-8\'\'' +
        encodeURIComponent('用户上传图件信息') + '.xlsx')
      res.set({ 'Content-Type': 'application/octet-stream' })
      res.status(200).send(wbbuf)

    })

  })
}


function sheet_from_array_of_arrays(data) {
  var ws = {}
  var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }}
  for(var R = 0; R != data.length; ++R) {
    for(var C = 0; C != data[R].length; ++C) {
      if(range.s.r > R) 
        range.s.r = R
      if(range.s.c > C) 
        range.s.c = C
      if(range.e.r < R) 
        range.e.r = R
      if(range.e.c < C) 
        range.e.c = C
      var cell = {v: data[R][C] }
      if(cell.v == null) 
        continue
      var cell_ref = XLSX.utils.encode_cell({c:C,r:R})


      if(typeof cell.v === 'number') {
        cell.t = 'n'
      } else if(typeof cell.v === 'boolean') {
        cell.t = 'b'
      } else {
        cell.t = 's'
      }
      var style = {horizontal: 'center', vertical: 'center'}
      cell.s = {alignment: style}
      ws[cell_ref] = cell
    }
  }

  if(range.s.c < 10000000) 
    ws['!ref'] = XLSX.utils.encode_range(range)
  return ws
}
var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var async = require('async')
var sharp = require('sharp')
var Grid = require('gridfs-stream')
var Upload = require('../models/upload')


module.exports.list = function(req, res) {
  Upload.find({
    owner: req.params.username,
    is_deleted: false
  }, '-_id -__v -file_id -is_deleted -thumbnail -mini_thumbnail', function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(uploads)
  }).sort({ createdAt: -1 })
}


module.exports.create = function(req, res) {
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

    res.setHeader('Content-disposition', 'attachment; filename*=UTF-8\'\'' +
      encodeURIComponent(upload.name) + '.' + encodeURIComponent(upload.format))
    res.type(upload.format)
    readStream.pipe(res)
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

  if (req.query.search) {
    query.$text = { $search: req.query.search }
  }

  if (!req.user.role || req.user.role !== 'admin') {
    query.scope = 'public'
    query.is_deleted = false
  }

  Upload.find(query,
    '-_id -__v -file_id -thumbnail -mini_thumbnail',
    function(err, uploads) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      res.status(200).json(uploads)
    }).limit(limit).skip(skip).sort(sort)
}


module.exports.getStat = function(req, res) {
  var pipeline = [{
    $match: { is_deleted: false }
  }, {
    $group: { _id: '$owner', total: { $sum: 1 } }
  }, {
    $lookup: { from: 'users', localField: '_id', foreignField: 'username', as: 'users' }
  }, {
    $project: {
      _id: 0,
      total: 1,
      owner: '$_id',
      name: { $arrayElemAt: ['$users.name', 0] },
      location: { $arrayElemAt: ['$users.location', 0] },
      organization: { $arrayElemAt: ['$users.organization', 0] }
    }
  }, {
    $sort: { total: -1 }
  }]

  Upload.aggregate(pipeline, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(results)
  })
}

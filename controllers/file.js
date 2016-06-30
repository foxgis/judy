var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var shortid = require('shortid')
var mkdirp = require('mkdirp')
var async = require('async')
var sharp = require('sharp')
var gm = require('gm')
var File = require('../models/file')


module.exports.stats = function(req, res) {
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
      location: { $arrayElemAt: ['$users.location', 0] }
    }
  }, {
    $group: { _id: '$location', total: { $sum: '$total' } }
  }, {
    $project: {
      _id: 0,
      total: 1,
      location: '$_id'
    }
  }, {
    $sort: { total: -1 }
  }]

  File.aggregate(pipeline, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(results)
  })
}


module.exports.search = function(req, res) {
  var limit = +req.query.limit || 0
  var skip = +req.query.skip || 0
  var sort = req.query.sort

  var query = {}

  if (req.query.keywords) {
    query.$text = { $search: req.query.keywords }
  }

  if (!req.user.role || req.user.role !== 'admin') {
    query.scope = 'public'
    query.is_deleted = false
  }

  File.find(query, '-_id -__v', function(err, files) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(files)
  }).limit(limit).skip(skip).sort(sort)
}


module.exports.list = function(req, res) {
  File.find({
    owner: req.params.username,
    is_deleted: false
  }, '-_id -__v -is_deleted', function(err, files) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(files)
  }).sort({ createdAt: -1 })
}


module.exports.retrieve = function(req, res) {
  File.findOne({
    file_id: req.params.file_id,
    owner: req.params.username
  }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!file) {
      return res.sendStatus(404)
    }

    res.json(file)
  })
}


module.exports.upload = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var originalname = req.files[0].originalname
  var size = req.files[0].size

  var file_id = shortid.generate()

  async.autoInject({
    fileDir: function(callback) {
      var fileDir = path.join('files', username)
      mkdirp(fileDir, function(err) {
        callback(err, fileDir)
      })
    },
    newPath: function(fileDir, callback) {
      var newPath = path.join(fileDir, file_id)
      fs.rename(filePath, newPath, function(err) {
        callback(err, newPath)
      })
    },
    dimensions: function(newPath, callback) {
      if (['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.tif']
        .indexOf(path.extname(originalname).toLowerCase()) < 0) {
        return callback()
      }

      sharp(newPath).metadata(function(err, metadata) {
        if (err) {
          return callback(err)
        }

        var dpi = metadata.density || 72
        var width = Math.round(metadata.width / dpi * 25.4)
        var height = Math.round(metadata.height / dpi * 25.4)
        callback(null, [height, width])
      })
    },
    writeDB: function(dimensions, callback) {
      var newFile = new File({
        file_id: file_id,
        owner: username,
        name: path.basename(originalname, path.extname(originalname)),
        filename: originalname,
        filesize: size
      })

      if (dimensions) {
        newFile.dimensions = dimensions
      }

      var keys = ['scope', 'name', 'year', 'location', 'tags', 'description', 'scale', 'dimensions']
      keys.forEach(function(key) {
        if (req.body[key]) {
          newFile[key] = req.body[key]
        }
      })

      newFile.save(function(err, file) {
        callback(err, file)
      })
    }
  }, function(err, results) {
    fs.unlink(filePath, function() {})

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(results.writeDB)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'name', 'year', 'location', 'tags', 'description', 'scale', 'dimensions']

  File.findOneAndUpdate({
    file_id: req.params.file_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!file) {
      return res.sendStatus(404)
    }

    res.status(200).json(file)
  })
}


module.exports.delete = function(req, res) {
  File.findOneAndUpdate({
    file_id: req.params.file_id,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!file) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.downloadRaw = function(req, res) {
  var filePath = path.join('files', req.params.username, req.params.file_id)

  File.findOne({
    file_id: req.params.file_id,
    owner: req.params.username
  }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!file) {
      return res.sendStatus(404)
    }

    var filename = file.name + path.extname(file.filename)
    res.download(path.resolve(filePath), filename, function(err) {
      if (err) {
        return res.status(err.status).end()
      }
    })
  })
}


module.exports.preview = function(req, res) {
  var filePath = path.join('files', req.params.username, req.params.file_id)
  var width = +req.query.width || null
  var height = +req.query.height || null
  var quality = (+req.query.quality || 100) % 101
  if (!width && !height) width = 1000

  File.findOne({
    file_id: req.params.file_id,
    owner: req.params.username
  }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!file) {
      return res.sendStatus(404)
    }

    gm(filePath).thumbnail(width, height).quality(quality)
      .toBuffer('jpg', function(err, buffer) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        res.type('jpg')
        res.send(buffer)
      })
  })
}

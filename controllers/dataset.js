var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var shortid = require('shortid')
var mkdirp = require('mkdirp')
var async = require('async')
var Dataset = require('../models/dataset')
var geojsonExtent = require('geojson-extent')


//该模块包含了对数据集功能进行业务处理的各项函数

module.exports.list = function(req, res) {
  var query = {
    owner: req.params.username,
    is_deleted: false 
  }

  if (req.user.username !== req.params.username && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    query.scope = 'public'
  }

  Dataset.find(query, '-_id -__v -is_deleted', function(err, datasets) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(datasets)
  }).sort({ createdAt: -1 })
}


module.exports.listAll = function(req, res) {
  var query = {
    is_deleted: false 
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    query.$or = 
    [
        {owner: req.user.username},
        {scope: 'public'}
    ]
  }

  Dataset.find(query, '-_id -__v -is_deleted', function(err, datasets) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(datasets)
  }).sort({ createdAt: -1 })
}


module.exports.upload = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var originalname = req.files[0].originalname
  var size = req.files[0].size

  var dataset_id = shortid.generate()

  async.autoInject({
    fileDir: function(callback) {
      var fileDir = path.join('datasets', username)
      mkdirp(fileDir, function(err) {
        callback(err, fileDir)
      })
    },
    newPath: function(fileDir, callback) {
      var newPath = path.join(fileDir, dataset_id)
      fs.rename(filePath, newPath, function(err) {
        callback(err, newPath)
      })
    },
    bounds: function(newPath, callback) {
      // if (['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.tif']
      //   .indexOf(path.extname(originalname).toLowerCase()) < 0) {
      //   return callback()
      // }
      fs.readFile(newPath, function(err, data) {
        if (err) {
          return callback(err)
        }
        var bound = geojsonExtent(JSON.parse(data.toString()))
        callback(null, bound)
      })
    },
    writeDB: function(bounds, callback) {
      var newDataset = new Dataset({
        dataset_id: dataset_id,
        owner: username,
        filename: path.basename(originalname, path.extname(originalname)),
        format: path.extname(originalname),
        filesize: size
      })

      if (bounds) {
        newDataset.bounds = bounds
        newDataset.center = [bounds[0]+((bounds[2]-bounds[0])/2), bounds[1]+((bounds[3]-bounds[1])/2)]
      }

      newDataset.save(function(err, dataset) {
        callback(err, dataset)
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


module.exports.updateRaw = function(req, res) {
  var dataset_id = req.params.dataset_id
  var username = req.params.username
  var fileDir = path.join('datasets', username, dataset_id)
  async.autoInject({
    writeFile: function(callback) {
      fs.writeFile(fileDir, JSON.stringify(req.body,null,2), callback)
    },
    updateDB: function(writeFile, callback) {
      var bounds = geojsonExtent(req.body)
      var center = [bounds[0]+((bounds[2]-bounds[0])/2), bounds[1]+((bounds[3]-bounds[1])/2)]
      Dataset.findOneAndUpdate({
        dataset_id: dataset_id,
        owner: username
      }, {bound: bounds, center: center}, { new: true }, callback)
    }
  }, function(err, results) {

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(results.updateDB)
  })
}


module.exports.retrieve = function(req, res) {
  Dataset.findOne({
    dataset_id: req.params.dataset_id,
    owner: req.params.username
  }, function(err, dataset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!dataset) {
      return res.sendStatus(404)
    }

    res.json(dataset)
  })
}


module.exports.delete = function(req, res) {
  Dataset.findOneAndUpdate({
    dataset_id: req.params.dataset_id,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, dataset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!dataset) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.getRaw = function(req, res) {
  var filePath = path.join('datasets', req.params.username, req.params.dataset_id)

  Dataset.findOne({
    dataset_id: req.params.dataset_id,
    owner: req.params.username
  }, function(err, dataset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!dataset) {
      return res.sendStatus(404)
    }

    fs.readFile(filePath, function(err, buffer) {
      if (err) {
        return res.status(500).json({error: err})
      }
      res.set({ 'Content-Type': 'application/json' })
      res.status(200).send(buffer)
    })

  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'bounds', 'center']

  Dataset.findOneAndUpdate({
    dataset_id: req.params.dataset_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, dataset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!dataset) {
      return res.sendStatus(404)
    }

    res.status(200).json(dataset)
  })
}
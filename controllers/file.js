var _ = require('lodash')
var fs = require('fs')
var mongoose = require('mongoose')
var Grid = require('gridfs-stream')
var File = require('../models/file')


module.exports.list = function(req, res) {
  File.find({ owner: req.params.username }, function(err, files) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(files)
  })
}


module.exports.create = function(req, res) {
  var gfs = Grid(mongoose.connection.db, mongoose.mongo)
  var writeStream = gfs.createWriteStream({ filename: req.files[0].originalname })
  fs.createReadStream(req.files[0].path).pipe(writeStream)

  writeStream.on('error', function(err) {
    return res.status(500).json({ error: err })
  })

  writeStream.on('close', function(file) {
    var newFile = new File({
      fs_id: file._id,
      owner: req.params.username
    })

    newFile.save(function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      fs.unlink()
      res.status(200).json(newFile)
    })
  })
}


module.exports.retrieve = function(req, res) {
  File.find({
    file_id: req.params.file_id,
    owner: req.params.username
  }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!file) {
      return res.sendStatus(404)
    }

    res.status(200).json(file)
  })
}


module.exports.update = function(req, res) {
  var filter = ['tags', 'name', 'description']

  File.findOneAndUpdate({
    file_id: req.params.file_id,
    owner: req.params.username
  }, _.pick(req.body, filter), function(err, file) {
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
  File.findOneAndRemove({
    file_id: req.params.file_id,
    owner: req.params.username
  }, function(err, file) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    var gfs = Grid(mongoose.connection.db, mongoose.mongo)
    gfs.remove({ _id: file.fs_id }, function() {})

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
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

    var gfs = Grid(mongoose.connection.db, mongoose.mongo)
    var readStream = gfs.createReadStream({ _id: file.fs_id })
    readStream.on('error', function(err) {
      return res.status(500).json({ error: err })
    })

    res.setHeader('Content-disposition',
      'attachment; filename*=UTF-8\'\'' + fs.filename)
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
    readStream.pipe(res)
  })
}

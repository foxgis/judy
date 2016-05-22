var _ = require('lodash')
var fs = require('fs')
var mongoose = require('mongoose')
var Grid = require('gridfs-stream')
var Upload = require('../models/upload')


module.exports.list = function(req, res) {
  Upload.find({
    owner: req.params.username,
    is_deleted: false
  }, function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(uploads)
  })
}


module.exports.create = function(req, res) {
  var gfs = Grid(mongoose.connection.db, mongoose.mongo)
  var writeStream = gfs.createWriteStream({ filename: req.files[0].originalname })
  fs.createReadStream(req.files[0].path).pipe(writeStream)

  writeStream.on('error', function(err) {
    fs.unlink(req.files[0].path)
    return res.status(500).json({ error: err })
  })

  writeStream.on('close', function(file) {
    var newUpload = new Upload({
      file_id: file._id,
      owner: req.params.username,
      name: file.filename
    })

    newUpload.save(function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      fs.unlink(req.files[0].path)
      res.status(200).json(newUpload)
    })
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
  var filter = ['tags', 'name', 'description']

  Upload.findOneAndUpdate({
    upload_id: req.params.upload_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true, setDefaultsOnInsert: true }
  ,function(err, upload) {
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
    file_id: req.params.file_id,
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

    res.setHeader('Content-disposition',
      'attachment; filename*=UTF-8\'\'' + fs.filename)
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
    readStream.pipe(res)
  })
}

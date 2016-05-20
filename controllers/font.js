var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var Font = require('../models/font')


module.exports.list = function(req, res) {
  Font.find({
    owner: req.params.username,
    is_deleted: false
  }, function(err, fonts) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(fonts)
  })
}


module.exports.create = function(req, res) {
  res.sendStatus(200)
}


module.exports.retrieve = function(req, res) {
  Font.find({
    fontname: req.params.fontname,
    owner: req.params.username
  }, function(err, font) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!font) {
      return res.sendStatus(404)
    }

    res.status(200).json(font)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope']

  Font.findOneAndUpdate({
    fontname: req.params.fontname,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, font) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!font) {
      return res.sendStatus(404)
    }

    res.status(200).json(font)
  })
}


module.exports.delete = function(req, res) {
  Font.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
  var filePath = path.join('fonts', req.params.fontname, req.params.range + '.pbf')

  fs.readFile(filePath, function(err, pbf) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    return res.status(200).send(pbf)
  })
}

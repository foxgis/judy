var _ = require('lodash')
var validate = require('mapbox-gl-style-spec').validate
var escaper = require('mongo-key-escaper')
var Style = require('../models/style')


module.exports.list = function(req, res) {
  Style.find({
    owner: req.params.username,
    is_deleted: false
  }, 'style_id owner scope tags description version name createdAt updatedAt', function(err, styles) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(styles)
  }).sort({ createdAt: -1 })
}


module.exports.retrieve = function(req, res) {
  Style.findOne({
    style_id: req.params.style_id,
    owner: req.params.username
  }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    res.json(escaper.unescape(style.toJSON()))
  })
}


module.exports.create = function(req, res) {
  var errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json(errors)
  }

  var filter = ['_id', '__v', 'is_deleted', 'style_id', 'owner', 'createdAt', 'updatedAt']
  var style = _.omit(escaper.escape(req.body), filter)

  var newStyle = new Style(style)
  newStyle.owner = req.params.username

  newStyle.save(function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(escaper.unescape(style.toJSON()))
  })
}


module.exports.update = function(req, res) {
  var filter = ['_id', '__v', 'is_deleted', 'style_id', 'owner', 'createdAt', 'updatedAt']

  Style.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, _.omit(escaper.escape(req.body), filter), { new: true }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    res.json(escaper.unescape(style.toJSON()))
  })
}


module.exports.delete = function(req, res) {
  Style.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.downloadTile = function(req, res) {
  return res.sendStatus(200)
}


module.exports.preview = function(req, res) {
  return res.sendStatus(200)
}

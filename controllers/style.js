var _ = require('lodash')
var validate = require('mapbox-gl-style-spec').validate
var escaper = require('mongo-key-escaper')
var Style = require('../models/style')


module.exports.search = function(req, res) {
  var page = +req.query.page || 1

  Style.find({
    scope: 'public',
    tags: req.query.search,
    is_deleted: false
  }, 'style_id owner scope tags version name createdAt updatedAt', function(err, styles) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(styles)

  }).limit(20).skip(20 * (page - 1))
}


module.exports.list = function(req, res) {
  Style.find({
    owner: req.params.username,
    is_deleted: false
  }, 'style_id owner scope tags version name createdAt updatedAt', function(err, styles) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(styles)
  })
}


module.exports.create = function(req, res) {
  var errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json(errors)
  }

  var filter = ['_id', 'style_id', 'owner', 'createdAt', 'updatedAt', '__v']
  var style = _.omit(escaper.escape(req.body), filter)

  var newStyle = new Style(style)
  newStyle.owner = req.params.username

  newStyle.save(function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(escaper.unescape(newStyle.toJSON()))
  })
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

    res.status(200).json(escaper.unescape(style.toJSON()))
  })
}


module.exports.update = function(req, res) {
  var filter = ['_id', 'style_id', 'owner', 'createdAt', 'updatedAt', '__v']

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

    res.status(200).json(escaper.unescape(style.toJSON()))
  })
}


module.exports.delete = function(req, res) {
  Style.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.preview = function(req, res) {
  return res.sendStatus(200)
}
